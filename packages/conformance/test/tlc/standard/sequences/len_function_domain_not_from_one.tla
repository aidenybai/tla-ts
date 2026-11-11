(*---
description: A function with domain 0..1 is not a sequence.
ref: tlc2/module/Sequences.java#Len
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE len_function_domain_not_from_one ----
EXTENDS Sequences, Naturals
Test == Len([i \in 0..1 |-> i]) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module len_function_domain_not_from_one failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    (0 :> 0 @@ 1 :> 1)
init:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    (0 :> 0 @@ 1 :> 1)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_function_domain_not_from_one
    1. Line 14, column 29 to line 14, column 32 in len_function_domain_not_from_one
    2. Line 12, column 9 to line 12, column 35 in len_function_domain_not_from_one
    3. Line 12, column 9 to line 12, column 31 in len_function_domain_not_from_one
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Len should be a sequence, but instead it is:
    (0 :> 0 @@ 1 :> 1)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in len_function_domain_not_from_one
    1. Line 15, column 30 to line 15, column 33 in len_function_domain_not_from_one
    2. Line 12, column 9 to line 12, column 35 in len_function_domain_not_from_one
    3. Line 12, column 9 to line 12, column 31 in len_function_domain_not_from_one
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    (0 :> 0 @@ 1 :> 1)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_function_domain_not_from_one
    1. Line 16, column 8 to line 16, column 32 in len_function_domain_not_from_one
    2. Line 16, column 29 to line 16, column 32 in len_function_domain_not_from_one
    3. Line 12, column 9 to line 12, column 35 in len_function_domain_not_from_one
    4. Line 12, column 9 to line 12, column 31 in len_function_domain_not_from_one
property:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    (0 :> 0 @@ 1 :> 1)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in len_function_domain_not_from_one
    1. Line 15, column 12 to line 15, column 36 in len_function_domain_not_from_one
    2. Line 15, column 33 to line 15, column 36 in len_function_domain_not_from_one
    3. Line 12, column 9 to line 12, column 35 in len_function_domain_not_from_one
    4. Line 12, column 9 to line 12, column 31 in len_function_domain_not_from_one
---*)
