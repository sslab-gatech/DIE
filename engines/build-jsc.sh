#!/bin/bash


# old version doesn't support clang ?
export LLVM_ROOT="/usr/bin"
export CC="gcc-7"
# "$LLVM_ROOT/clang-6.0" 
export CXX="g++-7"
# "$LLVM_ROOT/clang++-6.0" 

if [ -z $1 ] ; then
  echo "usage: $0 <version>"
  exit 1
fi
pushd webkit-$1

# debug mode
#CFLAGS=-g ./Tools/Scripts/build-jsc --jsc-only --makeargs="-j$(nproc)" --debug --system-malloc --cmakeargs=-DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer -g"
CFLAGS=-g ./Tools/Scripts/build-jsc --jsc-only --makeargs="-j$(nproc)" --debug --system-malloc --cmakeargs=-DCMAKE_CXX_FLAGS="-g"
# release mode
#CFLAGS=-g ./Tools/Scripts/build-jsc --jsc-only --makeargs="-j$(nproc)" --cmakeargs=-DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer -g"
CFLAGS=-g ./Tools/Scripts/build-jsc --jsc-only --makeargs="-j$(nproc)" --cmakeargs=-DCMAKE_CXX_FLAGS="-g"

# The symbol information can take quite some time to parse by the debugger. We can reduce the load time of the debugger significantly by running gdb-add-index on both jsc and libJavaScriptCore.so.
# how to run engine with dumping bytecodes
# JSC_dumpBytecodeAtDFGTime=true JSC_useConcurrentJIT=false JSC_dumpDFGDisassembly=true ../../Release/bin/jsc ~/jsfuzz/js-static/my_test/WebKit/optimization/redundancy/cve-2018-4233.js 2>out
