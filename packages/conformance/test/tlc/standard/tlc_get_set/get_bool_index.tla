(*---
description: A Boolean index asks for a nonnegative integer.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE get_bool_index ----
EXTENDS TLC, Naturals
Test == TLCGet(TRUE) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
init:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_bool_index
    1. Line 14, column 29 to line 14, column 32 in get_bool_index
    2. Line 12, column 9 to line 12, column 24 in get_bool_index
    3. Line 12, column 9 to line 12, column 20 in get_bool_index
next:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in get_bool_index
    1. Line 15, column 30 to line 15, column 33 in get_bool_index
    2. Line 12, column 9 to line 12, column 24 in get_bool_index
    3. Line 12, column 9 to line 12, column 20 in get_bool_index
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_bool_index
    1. Line 16, column 8 to line 16, column 32 in get_bool_index
    2. Line 16, column 29 to line 16, column 32 in get_bool_index
    3. Line 12, column 9 to line 12, column 24 in get_bool_index
    4. Line 12, column 9 to line 12, column 20 in get_bool_index
property:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCGet should be a nonnegative integer, but instead it is:
    TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_bool_index
    1. Line 15, column 12 to line 15, column 36 in get_bool_index
    2. Line 15, column 33 to line 15, column 36 in get_bool_index
    3. Line 12, column 9 to line 12, column 24 in get_bool_index
    4. Line 12, column 9 to line 12, column 20 in get_bool_index
---*)
