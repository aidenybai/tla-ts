(*---
description: An operator parameter appears in the signature.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE eval_def_prefix_operator_signature ----
EXTENDS TLCExt, TLC, Naturals
G(Op(_), a) == a
Test == TLCEvalDefinition("G") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
init:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in eval_def_prefix_operator_signature
    1. Line 15, column 29 to line 15, column 32 in eval_def_prefix_operator_signature
    2. Line 13, column 9 to line 13, column 34 in eval_def_prefix_operator_signature
    3. Line 13, column 9 to line 13, column 30 in eval_def_prefix_operator_signature
next:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 33 in eval_def_prefix_operator_signature
    1. Line 16, column 30 to line 16, column 33 in eval_def_prefix_operator_signature
    2. Line 13, column 9 to line 13, column 34 in eval_def_prefix_operator_signature
    3. Line 13, column 9 to line 13, column 30 in eval_def_prefix_operator_signature
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in eval_def_prefix_operator_signature
    1. Line 17, column 8 to line 17, column 32 in eval_def_prefix_operator_signature
    2. Line 17, column 29 to line 17, column 32 in eval_def_prefix_operator_signature
    3. Line 13, column 9 to line 13, column 34 in eval_def_prefix_operator_signature
    4. Line 13, column 9 to line 13, column 30 in eval_def_prefix_operator_signature
property:
  exit: 75
  transcript: |-
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    | While working on the initial state:
    | conformance_state = TRUE
    2283:0 The argument of TLCEvalDefinition should be a a zero-arity definition, but instead it is:
    G(Op(_), a)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 32 in eval_def_prefix_operator_signature
    1. Line 16, column 12 to line 16, column 36 in eval_def_prefix_operator_signature
    2. Line 16, column 33 to line 16, column 36 in eval_def_prefix_operator_signature
    3. Line 13, column 9 to line 13, column 34 in eval_def_prefix_operator_signature
    4. Line 13, column 9 to line 13, column 30 in eval_def_prefix_operator_signature
---*)
