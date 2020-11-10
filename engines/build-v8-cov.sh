#!/bin/bash

if [ -z $1 ] ; then
  echo "usage: $0 <version>"
  exit 1
fi

if [ ! -d "utils/depot_tools" ]; then
  git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git utils/depot_tools
fi

export PATH=$PATH:$PWD/utils/depot_tools
export CC="$PWD/compiler/clang" 
export CXX="$PWD/compiler/clang++" 

pushd v8-$1/v8

# only for mindwipe..
export PYTHONHTTPSVERIFY=0
gclient sync

./build/install-build-deps.sh

#tools/dev/gm.py x64.debug
rm -rf out/Debug
gn args out/Debug
cp ../../utils/args_debug.gn out/Debug/args.gn
gn args out/Debug
mv third_party/llvm-build/Release+Asserts/bin/clang third_party/llvm-build/Release+Asserts/bin/clang.bak
#rm third_party/llvm-build/Release+Asserts/bin/clang++ third_party/llvm-build/Release+Asserts/bin/clang-cl
ln -s $PWD/../../compiler/proxy.py third_party/llvm-build/Release+Asserts/bin/clang
#ln -s $PWD/../../compiler/proxy.py third_party/llvm-build/Release+Asserts/bin/clang++
#ln -s $PWD/../../compiler/proxy.py third_party/llvm-build/Release+Asserts/bin/clang-cl
ninja -C out/Debug


#gn args out/Release
#cp ../../utils/args_release.gn out/Release/args.gn
#gn args out/Release
#ninja -C out/Release
