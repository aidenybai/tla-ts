(*---
description: A string argument is not an enumerable set.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: evaluation-failure
includes:
  - TransitiveClosure.tla
---*)
---- MODULE non_enumerable_string ----
EXTENDS TransitiveClosure
Test == Warshall("ab") = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module non_enumerable_string failed.
    2176:0 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    "ab"
init:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in non_enumerable_string
    1. Line 16, column 29 to line 16, column 32 in non_enumerable_string
    2. Line 14, column 9 to line 14, column 27 in non_enumerable_string
    3. Line 14, column 9 to line 14, column 22 in non_enumerable_string
next:
  exit: 255
  transcript: |-
    2176:1 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    "ab"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in non_enumerable_string
    1. Line 17, column 30 to line 17, column 33 in non_enumerable_string
    2. Line 14, column 9 to line 14, column 27 in non_enumerable_string
    3. Line 14, column 9 to line 14, column 22 in non_enumerable_string
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in non_enumerable_string
    1. Line 18, column 8 to line 18, column 32 in non_enumerable_string
    2. Line 18, column 29 to line 18, column 32 in non_enumerable_string
    3. Line 14, column 9 to line 14, column 27 in non_enumerable_string
    4. Line 14, column 9 to line 14, column 22 in non_enumerable_string
property:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying TransitiveClosure to the following value,
    which is not an enumerable set:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in non_enumerable_string
    1. Line 17, column 12 to line 17, column 36 in non_enumerable_string
    2. Line 17, column 33 to line 17, column 36 in non_enumerable_string
    3. Line 14, column 9 to line 14, column 27 in non_enumerable_string
    4. Line 14, column 9 to line 14, column 22 in non_enumerable_string
---*)
