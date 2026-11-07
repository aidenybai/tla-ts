(*---
description: A set argument is reported likewise.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE model_value_set_arg ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue({}) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
init:
  exit: 75
  transcript: |-
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in model_value_set_arg
    1. Line 14, column 29 to line 14, column 32 in model_value_set_arg
    2. Line 12, column 9 to line 12, column 29 in model_value_set_arg
    3. Line 12, column 9 to line 12, column 25 in model_value_set_arg
next:
  exit: 255
  transcript: |-
    2283:1 The argument of ModelValue should be a string, but instead it is:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in model_value_set_arg
    1. Line 15, column 30 to line 15, column 33 in model_value_set_arg
    2. Line 12, column 9 to line 12, column 29 in model_value_set_arg
    3. Line 12, column 9 to line 12, column 25 in model_value_set_arg
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in model_value_set_arg
    1. Line 16, column 8 to line 16, column 32 in model_value_set_arg
    2. Line 16, column 29 to line 16, column 32 in model_value_set_arg
    3. Line 12, column 9 to line 12, column 29 in model_value_set_arg
    4. Line 12, column 9 to line 12, column 25 in model_value_set_arg
property:
  exit: 75
  transcript: |-
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2283:0 The argument of ModelValue should be a string, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in model_value_set_arg
    1. Line 15, column 12 to line 15, column 36 in model_value_set_arg
    2. Line 15, column 33 to line 15, column 36 in model_value_set_arg
    3. Line 12, column 9 to line 12, column 29 in model_value_set_arg
    4. Line 12, column 9 to line 12, column 25 in model_value_set_arg
---*)
