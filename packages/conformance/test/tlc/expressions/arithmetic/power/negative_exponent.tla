(*---
description: "A negative exponent is an argument error."
ref: "tlc2/module/Integers.java#Expt"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE negative_exponent ----
EXTENDS Integers
Test == 2 ^ (-1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
init:
  exit: 75
  transcript: |-
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in negative_exponent
    1. Line 11, column 29 to line 11, column 32 in negative_exponent
    2. Line 9, column 9 to line 9, column 20 in negative_exponent
    3. Line 9, column 9 to line 9, column 16 in negative_exponent
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of ^ should be a natural number, but instead it is:
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in negative_exponent
    1. Line 12, column 30 to line 12, column 33 in negative_exponent
    2. Line 9, column 9 to line 9, column 20 in negative_exponent
    3. Line 9, column 9 to line 9, column 16 in negative_exponent
invariant:
  exit: 75
  transcript: |-
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in negative_exponent
    1. Line 13, column 8 to line 13, column 32 in negative_exponent
    2. Line 13, column 29 to line 13, column 32 in negative_exponent
    3. Line 9, column 9 to line 9, column 20 in negative_exponent
    4. Line 9, column 9 to line 9, column 16 in negative_exponent
property:
  exit: 75
  transcript: |-
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in negative_exponent
    1. Line 12, column 12 to line 12, column 36 in negative_exponent
    2. Line 12, column 33 to line 12, column 36 in negative_exponent
    3. Line 9, column 9 to line 9, column 20 in negative_exponent
    4. Line 9, column 9 to line 9, column 16 in negative_exponent
---*)
