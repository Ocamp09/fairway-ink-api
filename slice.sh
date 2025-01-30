#! /bin/bash

# Location of PrusaSlicer
SLICER="C:\Program Files\Prusa3D\PrusaSlicer\prusa-slicer.exe"

#echo $file

$SLICER \
    --load ./config.ini \
    --slice \
    --export-gcode \
    miami_logo.stl
