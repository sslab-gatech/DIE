#!/bin/bash

pushd gecko-dev/js/src

HASH=`git rev-parse HEAD`


echo $BUILD
autoconf2.13

LLVM_ROOT="/usr/local/bin"
CC="$LLVM_ROOT/clang" \
CXX="$LLVM_ROOT/clang++" \

CFLAGS="-fsanitize=address" \
CXXFLAGS="-fsanitize=address" \
LDFLAGS="-fsanitize=address" \
mkdir $HASH
pushd $HASH

BUILD="Debug"
mkdir $BUILD
pushd $BUILD

#../../configure --enable-debug --disable-optimize --enable-address-sanitizer --disable-jemalloc
../../configure --enable-debug --enable-optimize 
make -j 8

popd

BUILD="Release"
mkdir $BUILD
pushd $BUILD
#../../configure --enable-optimize --enable-address-sanitizer --disable-jemalloc
../../configure --enable-optimize
make -j 8
