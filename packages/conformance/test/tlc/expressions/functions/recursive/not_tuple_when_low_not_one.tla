(*---
description: "A recursive function on 2..3 is not a sequence."
ref: "tlc2/value/impl/FcnLambdaValue.java#toTuple"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE not_tuple_when_low_not_one ----
EXTENDS Integers, Sequences
F[n \in 2..3] == IF n = 2 THEN 0 ELSE F[n - 1]
Test == Len(F) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 11 of module not_tuple_when_low_not_one failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    (2 :> 0 @@ 3 :> 0)
init:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    (2 :> 0 @@ 3 :> 0)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in not_tuple_when_low_not_one
    1. Line 12, column 29 to line 12, column 32 in not_tuple_when_low_not_one
    2. Line 10, column 9 to line 10, column 18 in not_tuple_when_low_not_one
    3. Line 10, column 9 to line 10, column 14 in not_tuple_when_low_not_one
next:
  exit: 255
  transcript: |-
    2283:1 The argument of Len should be a sequence, but instead it is:
    (2 :> 0 @@ 3 :> 0)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in not_tuple_when_low_not_one
    1. Line 13, column 30 to line 13, column 33 in not_tuple_when_low_not_one
    2. Line 10, column 9 to line 10, column 18 in not_tuple_when_low_not_one
    3. Line 10, column 9 to line 10, column 14 in not_tuple_when_low_not_one
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    (2 :> 0 @@ 3 :> 0)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in not_tuple_when_low_not_one
    1. Line 14, column 8 to line 14, column 32 in not_tuple_when_low_not_one
    2. Line 14, column 29 to line 14, column 32 in not_tuple_when_low_not_one
    3. Line 10, column 9 to line 10, column 18 in not_tuple_when_low_not_one
    4. Line 10, column 9 to line 10, column 14 in not_tuple_when_low_not_one
property:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of Len should be a sequence, but instead it is:
    (2 :> 0 @@ 3 :> 0)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in not_tuple_when_low_not_one
    1. Line 13, column 12 to line 13, column 36 in not_tuple_when_low_not_one
    2. Line 13, column 33 to line 13, column 36 in not_tuple_when_low_not_one
    3. Line 10, column 9 to line 10, column 18 in not_tuple_when_low_not_one
    4. Line 10, column 9 to line 10, column 14 in not_tuple_when_low_not_one
---*)
