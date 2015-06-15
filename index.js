var clone = require('lodash.clone');

var SUMMON = (function () {
  
  var commands = [];  

  var escapeLuceneSyntax = function escapeLuceneSyntax(rawQueryString) {
    if (rawQueryString === undefined) {
      return undefined;
    }
    return rawQueryString.replace(luceneEscapeRegex, "\\$1");
  };

  var addCommand = function addCommand(commandName, queryString, els) {
    var command;
    if (queryString === undefined || queryString === null) {
      command = commandName+"()";
    } else {
      if (els === undefined) {
        els = defaultEscapeLucene;
      }
      command = commandName+"("+ (els ? escapeLuceneSyntax(queryString) : queryString)+")";
    }
    commands.push(command);
  };

  var clearAll = function clearAll() {
    commands = ["clearAll()"];
  };

  var defaultEscapeLucene = true;
  var luceneEscapeRegex = /([-+&|!(){}[\]^"~*?:\\])/g;

  var requestHeaders = {};
  var transport = undefined;

  var SESSION_HEADER_NAME = "x-summon-session-id";
  var SUMMON_ROLE_AUTH_HEADER_NAME = "x-summon-role-auth";

  var setSessionId = function setSessionId(id) {
    if (id === null || id === undefined) {
      delete requestHeaders[SESSION_HEADER_NAME];
    } else {
      requestHeaders[SESSION_HEADER_NAME] = id;
    }
  };

  var delegateSubmit = function delegateSubmit(fail, fun, instance) {
    fun.call(instance, fail, ret.submit, ret);
  }

  var submit = function submit(fail, auth) {
    //TODO cancel any pre-existing submit callbacks
    var len = commands.length;
    var url = "/2.0.0/search?";
    if (len > 0) {
      url += "s.cmd="+encodeURIComponent(commands[0]);
      for (var i = 1; i < len; i++) {
        url += encodeURIComponent(commands[i]);
      }
    }
    var headers;
console.log("asldkfjkasdf"+JSON.stringify(auth));
    if (auth === null || auth === undefined) {
      headers = requestHeaders;
    } else {
      headers = clone(requestHeaders);
      headers[SUMMON_ROLE_AUTH_HEADER_NAME] = auth.iv + ';' + auth.ciphertext;
    }
    transport(url, done, fail, headers);
  };

  var data = undefined;

  var callbacks = [];

  var addCallback = function addCallback(fun) {
    callbacks.push(fun);
    if (data !== undefined) {
      fun(data);
    }
  };

  var updateData = function updateData(val) {
    data = val;
    invokeCallbacks();
  };

  var invokeCallbacks = function invokeCallbacks() {
    var len = callbacks.length;
    for (var i = 0; i < len; i++) {
      callbacks[i](data);
    }
  };

  var done = function done(data) {
    setSessionId(data.sessionId);
    updateData(data);
  };

  var ret = {
    submit: submit,
    delegateSubmit: delegateSubmit,
    setTextQuery: function setTextQuery(queryString, escapeLuceneSyntax) {
      return addCommand('setTextQuery', queryString, escapeLuceneSyntax);
    },
    addFacetValueFilters: function addFacetValueFilters(facetValueFilters) {
      return addCommand('addFacetValueFilters', facetValueFilters, false);
    },
    setPageSize: function setPageSize(size) {
      return addCommand('setPageSize', size, false);
    },
    setHoldingsOnly: function setHoldingsOnly(holdingsOnly) {
      return addCommand('setHoldingsOnly', holdingsOnly, false);
    },
    clearAll: clearAll,
    setTransportFunction: function(fun) {
      transport = fun;
    },
    addCallback: addCallback,
    escapeLuceneSyntax: escapeLuceneSyntax
  };

  return ret;
})();

var jQuery = require('jquery');

SUMMON.setTransportFunction(function(url, done, fail, headers) {
  console.log("request URL: "+url);
  jQuery.ajax(url, {
    "headers": headers,
    "dataType": "json"
  }).done(done).fail(function(jqXHR, textStatus, errorThrown) {
    console.log(errorThrown);
    if (fail !== undefined) {
      fail(errorThrown);
    }
  });
});

module.exports = SUMMON;

