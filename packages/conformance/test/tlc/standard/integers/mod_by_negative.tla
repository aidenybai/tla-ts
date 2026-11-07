(*---
description: "% by a negative prints it through IntValue.toString."
ref: tlc2/module/Integers.java#Mod
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE mod_by_negative ----
EXTENDS Integers
Test == 7 % -1 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
init:
  exit: 75
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in mod_by_negative
    1. Line 14, column 29 to line 14, column 32 in mod_by_negative
    2. Line 12, column 9 to line 12, column 18 in mod_by_negative
    3. Line 12, column 9 to line 12, column 14 in mod_by_negative
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of % should be a positive number, but instead it is:
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in mod_by_negative
    1. Line 15, column 30 to line 15, column 33 in mod_by_negative
    2. Line 12, column 9 to line 12, column 18 in mod_by_negative
    3. Line 12, column 9 to line 12, column 14 in mod_by_negative
invariant:
  exit: 75
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in mod_by_negative
    1. Line 16, column 8 to line 16, column 32 in mod_by_negative
    2. Line 16, column 29 to line 16, column 32 in mod_by_negative
    3. Line 12, column 9 to line 12, column 18 in mod_by_negative
    4. Line 12, column 9 to line 12, column 14 in mod_by_negative
property:
  exit: 75
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in mod_by_negative
    1. Line 15, column 12 to line 15, column 36 in mod_by_negative
    2. Line 15, column 33 to line 15, column 36 in mod_by_negative
    3. Line 12, column 9 to line 12, column 18 in mod_by_negative
    4. Line 12, column 9 to line 12, column 14 in mod_by_negative
---*)
