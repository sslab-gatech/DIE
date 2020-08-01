#!/bin/bash

pushd gecko-dev/js/src

HASH=`git rev-parse HEAD`


echo $BUILD
autoconf2.13

LLVM_ROOT="/usr/local/bin"
export CC="$PWD/compiler/clang" 
export CXX="$PWD/compiler/clang++" 

export CXXFLAGS="-O1 -fno-omit-frame-pointer"
export CFLAGS="-O1 -fno-omit-frame-pointer"
mkdir $HASH
pushd $HASH

BUILD="Debug"
mkdir $BUILD
pushd $BUILD

#../../configure --enable-debug --disable-optimize --enable-address-sanitizer --disable-jemalloc
../../configure --enable-debug --enable-optimize 
make -j 8

popd

#BUILD="Release"
#mkdir $BUILD
#pushd $BUILD
#../../configure --enable-optimize
#make -j 8
