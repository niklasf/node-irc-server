#!/bin/bash

echo "=============== UNIT TESTS ==============="
nodeunit tests/

echo ""
echo ""
echo "============== CODE QUALITY =============="
nodelint lib/* tests/*
