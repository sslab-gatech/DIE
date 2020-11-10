#!/bin/bash

# check webkit latest here: https://webkitgtk.org/releases/

if [ -z $1 ] || [ -z $2 ] ; then
  echo "usage: $0 <engines> <version> (engines : ch, jsc, v8, sm)"
fi

if [ "$1" = "jsc" ] && [ ! -d "webkit-$2" ] ; then
  svn co https://svn.webkit.org/repository/webkit/releases/WebKitGTK/webkit-$2
elif [ "$1" = "ch" ] && [ ! -d "chakracore-$2" ] ; then
  if [ "$2" = "m" ]; then
    git clone --single-branch --branch master https://github.com/Microsoft/ChakraCore.git chakracore-$2
  else 
    git clone --single-branch --branch v$2 https://github.com/Microsoft/ChakraCore.git chakracore-$2
  fi
elif [ "$1" = "v8" ] && [ ! -d "v8-$2" ]; then
  PATH=$PATH:$PWD/utils/depot_tools
  mkdir v8-$2
  pushd v8-$2
  export PYTHONHTTPSVERIFY=0
  fetch v8
  pushd v8
  git checkout origin/$2
elif [ "$1" = "sm" ] && [ ! -d "gecko-dev" ] ; then
	git clone https://github.com/mozilla/gecko-dev.git
elif [ "$1" = "sm" ] && [ "$2" = "latest" ] ; then
  pushd gecko-dev/
  git pull
fi
