#!/bin/bash

# Build WebAssembly module for high-performance audio processing
# Requires Emscripten SDK to be installed and activated

echo "Building High-Performance Audio Processor WASM module..."

# Set optimization flags for maximum performance
EMCC_FLAGS="-O3 -s WASM=1 -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME='FastAudioModule'"
EMCC_FLAGS="$EMCC_FLAGS -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=33554432"
EMCC_FLAGS="$EMCC_FLAGS -s EXPORTED_RUNTIME_METHODS='[\"ccall\",\"cwrap\"]'"
EMCC_FLAGS="$EMCC_FLAGS -s ENVIRONMENT='web,worker'"
EMCC_FLAGS="$EMCC_FLAGS -s USE_PTHREADS=0 -s DISABLE_EXCEPTION_CATCHING=1"
EMCC_FLAGS="$EMCC_FLAGS -s AGGRESSIVE_VARIABLE_ELIMINATION=1"
EMCC_FLAGS="$EMCC_FLAGS -s ELIMINATE_DUPLICATE_FUNCTIONS=1"

# Advanced optimizations
EMCC_FLAGS="$EMCC_FLAGS --closure 1 --llvm-lto 3"
EMCC_FLAGS="$EMCC_FLAGS -msimd128 -ffast-math"

# Bind with Embind for JavaScript integration
EMCC_FLAGS="$EMCC_FLAGS --bind"

# Create output directory
mkdir -p ../../client/public/wasm

# Compile the WebAssembly module
emcc src/fast_audio_processor.cpp \
    $EMCC_FLAGS \
    -o ../../client/public/wasm/fast_audio.js

# Also create a worker version for background processing
emcc src/fast_audio_processor.cpp \
    $EMCC_FLAGS \
    -s ENVIRONMENT='worker' \
    -o ../../client/public/wasm/fast_audio_worker.js

echo "WebAssembly modules built successfully!"
echo "Modules available at:"
echo "  - client/public/wasm/fast_audio.js"
echo "  - client/public/wasm/fast_audio.wasm"
echo "  - client/public/wasm/fast_audio_worker.js"
echo "  - client/public/wasm/fast_audio_worker.wasm"

# Set executable permissions
chmod +x ../../client/public/wasm/*.js
