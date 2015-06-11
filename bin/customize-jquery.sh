#!/usr/bin/env sh

git submodule init
git submodule update
cd node_modules/jquery && \
npm install && \
grunt custom:-exports/amd,-exports:global
