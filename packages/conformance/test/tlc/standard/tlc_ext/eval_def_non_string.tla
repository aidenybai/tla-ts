(*---
description: A non-string argument asks for a string.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE eval_def_non_string ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCEvalDefinition(1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
init:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in eval_def_non_string
    1. Line 14, column 29 to line 14, column 32 in eval_def_non_string
    2. Line 12, column 9 to line 12, column 32 in eval_def_non_string
    3. Line 12, column 9 to line 12, column 28 in eval_def_non_string
next:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in eval_def_non_string
    1. Line 15, column 30 to line 15, column 33 in eval_def_non_string
    2. Line 12, column 9 to line 12, column 32 in eval_def_non_string
    3. Line 12, column 9 to line 12, column 28 in eval_def_non_string
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in eval_def_non_string
    1. Line 16, column 8 to line 16, column 32 in eval_def_non_string
    2. Line 16, column 29 to line 16, column 32 in eval_def_non_string
    3. Line 12, column 9 to line 12, column 32 in eval_def_non_string
    4. Line 12, column 9 to line 12, column 28 in eval_def_non_string
property:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCEvalDefinition should be a string, but instead it is:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in eval_def_non_string
    1. Line 15, column 12 to line 15, column 36 in eval_def_non_string
    2. Line 15, column 33 to line 15, column 36 in eval_def_non_string
    3. Line 12, column 9 to line 12, column 32 in eval_def_non_string
    4. Line 12, column 9 to line 12, column 28 in eval_def_non_string
---*)
