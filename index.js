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

  var setSessionId = function setSessionId(id) {
    if (id === null || id === undefined) {
      delete requestHeaders[SESSION_HEADER_NAME];
    } else {
      requestHeaders[SESSION_HEADER_NAME] = id;
    }
  };

  var submit = function submit() {
    var len = commands.length;
    var url = "/2.0.0/search?";
    if (len > 0) {
      url += "s.cmd="+encodeURIComponent(commands[0]);
      for (var i = 1; i < len; i++) {
        url += encodeURIComponent(commands[i]);
      }
    }
    transport(url, done, fail, requestHeaders);
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

  var fail = function fail() {
    alert('failed');
  };

  var ret = {
    submit: submit,
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
    fail();
  });
});

module.exports = SUMMON;

