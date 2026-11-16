(*---
description: A tuple is not a set.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE permutations_tuple ----
EXTENDS TLC, Naturals
Test == Permutations(<<1, 2>>) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module permutations_tuple failed.
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<1, 2>>
init:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<1, 2>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in permutations_tuple
    1. Line 14, column 29 to line 14, column 32 in permutations_tuple
    2. Line 12, column 9 to line 12, column 35 in permutations_tuple
    3. Line 12, column 9 to line 12, column 30 in permutations_tuple
next:
  exit: 255
  transcript: |-
    2176:1 Applying Permutations to the following value,
    which is not a finite set:
    <<1, 2>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in permutations_tuple
    1. Line 15, column 30 to line 15, column 33 in permutations_tuple
    2. Line 12, column 9 to line 12, column 35 in permutations_tuple
    3. Line 12, column 9 to line 12, column 30 in permutations_tuple
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<1, 2>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in permutations_tuple
    1. Line 16, column 8 to line 16, column 32 in permutations_tuple
    2. Line 16, column 29 to line 16, column 32 in permutations_tuple
    3. Line 12, column 9 to line 12, column 35 in permutations_tuple
    4. Line 12, column 9 to line 12, column 30 in permutations_tuple
property:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<1, 2>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in permutations_tuple
    1. Line 15, column 12 to line 15, column 36 in permutations_tuple
    2. Line 15, column 33 to line 15, column 36 in permutations_tuple
    3. Line 12, column 9 to line 12, column 35 in permutations_tuple
    4. Line 12, column 9 to line 12, column 30 in permutations_tuple
---*)
