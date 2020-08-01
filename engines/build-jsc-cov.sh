#!/bin/bash

export CC="$PWD/compiler/clang" 
export CXX="$PWD/compiler/clang++" 

if [ -z $1 ] ; then
  echo "usage: $0 <version>"
  exit 1
fi
pushd webkit-$1

./Tools/Scripts/build-jsc --jsc-only --debug --cmakeargs="-DENABLE_STATIC_JSC=ON"
