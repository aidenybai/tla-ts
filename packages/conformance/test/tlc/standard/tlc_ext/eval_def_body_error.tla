(*---
description: An error in the body propagates.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE eval_def_body_error ----
EXTENDS TLCExt, TLC, Naturals
D == 1 \div 0
Test == TLCEvalDefinition("D") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in eval_def_body_error
    1. Line 15, column 29 to line 15, column 32 in eval_def_body_error
    2. Line 13, column 9 to line 13, column 34 in eval_def_body_error
    3. Line 13, column 9 to line 13, column 30 in eval_def_body_error
    4. Line 12, column 6 to line 12, column 13 in eval_def_body_error
next:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in eval_def_body_error
    1. Line 16, column 30 to line 16, column 33 in eval_def_body_error
    2. Line 13, column 9 to line 13, column 34 in eval_def_body_error
    3. Line 13, column 9 to line 13, column 30 in eval_def_body_error
    4. Line 12, column 6 to line 12, column 13 in eval_def_body_error
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    | While working on the initial state:
    | conformance_state = TRUE
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in eval_def_body_error
    1. Line 17, column 8 to line 17, column 32 in eval_def_body_error
    2. Line 17, column 29 to line 17, column 32 in eval_def_body_error
    3. Line 13, column 9 to line 13, column 34 in eval_def_body_error
    4. Line 13, column 9 to line 13, column 30 in eval_def_body_error
    5. Line 12, column 6 to line 12, column 13 in eval_def_body_error
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    | While working on the initial state:
    | conformance_state = TRUE
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in eval_def_body_error
    1. Line 16, column 12 to line 16, column 36 in eval_def_body_error
    2. Line 16, column 33 to line 16, column 36 in eval_def_body_error
    3. Line 13, column 9 to line 13, column 34 in eval_def_body_error
    4. Line 13, column 9 to line 13, column 30 in eval_def_body_error
    5. Line 12, column 6 to line 12, column 13 in eval_def_body_error
---*)
