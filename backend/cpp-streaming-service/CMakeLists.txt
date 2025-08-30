cmake_minimum_required(VERSION 3.16)
project(CatchStreamingService)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(Boost REQUIRED COMPONENTS system filesystem thread)
find_package(PkgConfig REQUIRED)

# WebSocket++ (header-only library)
include_directories(/usr/local/include/websocketpp)

# Beast library (part of Boost)
find_package(Boost REQUIRED COMPONENTS beast)

# Add executable
add_executable(streaming_server
    src/streaming_server.cpp
)

# Link libraries
target_link_libraries(streaming_server
    ${Boost_LIBRARIES}
    pthread
)

# Compiler flags for optimization
target_compile_options(streaming_server PRIVATE
    -O3
    -march=native
    -ffast-math
    -DNDEBUG
)

# Include directories
target_include_directories(streaming_server PRIVATE
    ${Boost_INCLUDE_DIRS}
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Install target
install(TARGETS streaming_server
    RUNTIME DESTINATION bin
)
