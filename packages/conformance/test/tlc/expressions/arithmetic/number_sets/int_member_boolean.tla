(*---
description: "A Boolean checked against Int is an error."
ref: "tlc2/module/Integers.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE int_member_boolean ----
EXTENDS Integers
Test == TRUE \in Int
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module int_member_boolean failed.
    2158:0 Attempted to check if the value:
    TRUE
    is an element of Int.
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    TRUE
    is an element of Int.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in int_member_boolean
    1. Line 11, column 29 to line 11, column 32 in int_member_boolean
    2. Line 9, column 9 to line 9, column 20 in int_member_boolean
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    TRUE
    is an element of Int.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in int_member_boolean
    1. Line 12, column 30 to line 12, column 33 in int_member_boolean
    2. Line 9, column 9 to line 9, column 20 in int_member_boolean
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    TRUE
    is an element of Int.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in int_member_boolean
    1. Line 13, column 8 to line 13, column 32 in int_member_boolean
    2. Line 13, column 29 to line 13, column 32 in int_member_boolean
    3. Line 9, column 9 to line 9, column 20 in int_member_boolean
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    TRUE
    is an element of Int.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in int_member_boolean
    1. Line 12, column 12 to line 12, column 36 in int_member_boolean
    2. Line 12, column 33 to line 12, column 36 in int_member_boolean
    3. Line 9, column 9 to line 9, column 20 in int_member_boolean
---*)
