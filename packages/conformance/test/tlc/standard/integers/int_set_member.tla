(*---
description: Membership of a set in Int is an error.
ref: tlc2/module/Integers.java#member
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE int_set_member ----
EXTENDS Integers
Test == {} \in Int
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module int_set_member failed.
    2158:0 Attempted to check if the value:
    {}
    is an element of Int.
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    {}
    is an element of Int.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in int_set_member
    1. Line 14, column 29 to line 14, column 32 in int_set_member
    2. Line 12, column 9 to line 12, column 18 in int_set_member
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    {}
    is an element of Int.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in int_set_member
    1. Line 15, column 30 to line 15, column 33 in int_set_member
    2. Line 12, column 9 to line 12, column 18 in int_set_member
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    {}
    is an element of Int.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in int_set_member
    1. Line 16, column 8 to line 16, column 32 in int_set_member
    2. Line 16, column 29 to line 16, column 32 in int_set_member
    3. Line 12, column 9 to line 12, column 18 in int_set_member
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    {}
    is an element of Int.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in int_set_member
    1. Line 15, column 12 to line 15, column 36 in int_set_member
    2. Line 15, column 33 to line 15, column 36 in int_set_member
    3. Line 12, column 9 to line 12, column 18 in int_set_member
---*)
