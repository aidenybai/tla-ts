(*---
description: An unknown name reports what is expected.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE eval_def_not_found ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCEvalDefinition("Nope") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
init:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in eval_def_not_found
    1. Line 14, column 29 to line 14, column 32 in eval_def_not_found
    2. Line 12, column 9 to line 12, column 37 in eval_def_not_found
    3. Line 12, column 9 to line 12, column 33 in eval_def_not_found
next:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in eval_def_not_found
    1. Line 15, column 30 to line 15, column 33 in eval_def_not_found
    2. Line 12, column 9 to line 12, column 37 in eval_def_not_found
    3. Line 12, column 9 to line 12, column 33 in eval_def_not_found
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in eval_def_not_found
    1. Line 16, column 8 to line 16, column 32 in eval_def_not_found
    2. Line 16, column 29 to line 16, column 32 in eval_def_not_found
    3. Line 12, column 9 to line 12, column 37 in eval_def_not_found
    4. Line 12, column 9 to line 12, column 33 in eval_def_not_found
property:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCEvalDefinition should be a name of a definition reachable from the root module, but instead it is:
    "Nope"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in eval_def_not_found
    1. Line 15, column 12 to line 15, column 36 in eval_def_not_found
    2. Line 15, column 33 to line 15, column 36 in eval_def_not_found
    3. Line 12, column 9 to line 12, column 37 in eval_def_not_found
    4. Line 12, column 9 to line 12, column 33 in eval_def_not_found
---*)
