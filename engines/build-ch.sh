#!/bin/bash

if [ -z $1 ] ; then
  echo "usage: $0 <version>"
  exit 1
fi

LLVM_ROOT="/usr/bin"

# old version (1.5) needs clang-3.8.0
version=${1%.*}
version=$(echo $version | cut -f2 -d.)
if (( $(echo "$version > 6" | bc -l) )); then
CLANG="$LLVM_ROOT/clang-6.0" 
CLANGXX="$LLVM_ROOT/clang++-6.0"
echo "Clang version is 6.0"
else
CLANG="$LLVM_ROOT/clang-3.8" 
CLANGXX="$LLVM_ROOT/clang++-3.8"
echo "Clang version is 3.8"
fi


CLANG="$LLVM_ROOT/clang-6.0" 
CLANGXX="$LLVM_ROOT/clang++-6.0"
pushd chakracore-$1
patch -p0 < ../utils/new-chakra.patch

#debug mode
# it seems ASAN affects some bugs, so we turn off
#./build.sh --sanitize=address --static -j $(nproc) -d --cc=$CLANG --cxx=$CLANGXX
./build.sh --static -j $(nproc) -d --cc=$CLANG --cxx=$CLANGXX

#release mode
# it seems ASAN affects some bugs, so we turn off
#./build.sh --sanitize=address --static -j $(nproc) --cc=$CLANG --cxx=$CLANGXX
./build.sh --static -j $(nproc) --cc=$CLANG --cxx=$CLANGXX 

