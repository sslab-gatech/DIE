#!/bin/bash

export CC="$PWD/compiler/clang" 
export CXX="$PWD/compiler/clang++" 

if [ -z $1 ] ; then
  echo "usage: $0 <version>"
  exit 1
fi

pushd chakracore-$1
patch -p0 < ../utils/new-chakra.patch

export CXXFLAGS="-O1 -fno-omit-frame-pointer"
export CFLAGS="-O1 -fno-omit-frame-pointer"

./build.sh --static -j $(nproc) -d --cc=$CC --cxx=$CXX 
