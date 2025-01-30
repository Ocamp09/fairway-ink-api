#! /bin/bash

# Location of PrusaSlicer
SLICER="C:/Program Files/Prusa3D/PrusaSlicer/prusa-slicer.exe"

# Input STL file
INPUT_FILE="./output/miami_logo.stl"

# Run PrusaSlicer
"$SLICER" \
    --load ./config.ini \
    --slice \
    --export-gcode \
    "$INPUT_FILE"