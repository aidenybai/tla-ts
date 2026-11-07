(*---
description: A function with domain {1,3} is not a sequence.
ref: tlc2/value/impl/FcnRcdValue.java#toTuple
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE len_function_domain_gap ----
EXTENDS Sequences, Naturals
Test == Len([i \in {1, 3} |-> i]) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
init:
  exit: 75
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_function_domain_gap
    1. Line 14, column 29 to line 14, column 32 in len_function_domain_gap
    2. Line 12, column 9 to line 12, column 37 in len_function_domain_gap
    3. Line 12, column 9 to line 12, column 33 in len_function_domain_gap
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in len_function_domain_gap
    1. Line 15, column 30 to line 15, column 33 in len_function_domain_gap
    2. Line 12, column 9 to line 12, column 37 in len_function_domain_gap
    3. Line 12, column 9 to line 12, column 33 in len_function_domain_gap
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_function_domain_gap
    1. Line 16, column 8 to line 16, column 32 in len_function_domain_gap
    2. Line 16, column 29 to line 16, column 32 in len_function_domain_gap
    3. Line 12, column 9 to line 12, column 37 in len_function_domain_gap
    4. Line 12, column 9 to line 12, column 33 in len_function_domain_gap
property:
  exit: 75
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2283:0 The argument of Len should be a sequence, but instead it is:
    (1 :> 1 @@ 3 :> 3)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_function_domain_gap
    1. Line 15, column 12 to line 15, column 36 in len_function_domain_gap
    2. Line 15, column 33 to line 15, column 36 in len_function_domain_gap
    3. Line 12, column 9 to line 12, column 37 in len_function_domain_gap
    4. Line 12, column 9 to line 12, column 33 in len_function_domain_gap
---*)
