(*---
description: A negative index asks for a nonnegative integer.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE register_negative_get ----
EXTENDS TLC, Integers
Test == TLCGet(-1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
init:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in register_negative_get
    1. Line 14, column 29 to line 14, column 32 in register_negative_get
    2. Line 12, column 9 to line 12, column 22 in register_negative_get
    3. Line 12, column 9 to line 12, column 18 in register_negative_get
next:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in register_negative_get
    1. Line 15, column 30 to line 15, column 33 in register_negative_get
    2. Line 12, column 9 to line 12, column 22 in register_negative_get
    3. Line 12, column 9 to line 12, column 18 in register_negative_get
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in register_negative_get
    1. Line 16, column 8 to line 16, column 32 in register_negative_get
    2. Line 16, column 29 to line 16, column 32 in register_negative_get
    3. Line 12, column 9 to line 12, column 22 in register_negative_get
    4. Line 12, column 9 to line 12, column 18 in register_negative_get
property:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in register_negative_get
    1. Line 15, column 12 to line 15, column 36 in register_negative_get
    2. Line 15, column 33 to line 15, column 36 in register_negative_get
    3. Line 12, column 9 to line 12, column 22 in register_negative_get
    4. Line 12, column 9 to line 12, column 18 in register_negative_get
---*)
