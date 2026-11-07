(*---
description: \leq reports itself as <= when its first argument is bad.
ref: tlc2/module/Naturals.java#LE
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE le_first_not_int ----
EXTENDS Naturals
Test == "a" \leq 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in le_first_not_int
    1. Line 14, column 29 to line 14, column 32 in le_first_not_int
    2. Line 12, column 9 to line 12, column 18 in le_first_not_int
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of <= should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in le_first_not_int
    1. Line 15, column 30 to line 15, column 33 in le_first_not_int
    2. Line 12, column 9 to line 12, column 18 in le_first_not_int
invariant:
  exit: 75
  transcript: |-
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in le_first_not_int
    1. Line 16, column 8 to line 16, column 32 in le_first_not_int
    2. Line 16, column 29 to line 16, column 32 in le_first_not_int
    3. Line 12, column 9 to line 12, column 18 in le_first_not_int
property:
  exit: 75
  transcript: |-
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of <= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in le_first_not_int
    1. Line 15, column 12 to line 15, column 36 in le_first_not_int
    2. Line 15, column 33 to line 15, column 36 in le_first_not_int
    3. Line 12, column 9 to line 12, column 18 in le_first_not_int
---*)
