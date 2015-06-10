#!/usr/bin/env sh

git submodule update
git submodule init
cd node_modules/jquery && \
npm install && \
grunt custom:-exports/amd,-exports:global
