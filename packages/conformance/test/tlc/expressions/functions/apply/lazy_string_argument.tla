(*---
description: "Applying a function over Nat to a string fails in Nat.member."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_string_argument ----
EXTENDS Integers
Test == [x \in Nat |-> x]["a"] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_string_argument
    1. Line 11, column 29 to line 11, column 32 in lazy_string_argument
    2. Line 9, column 9 to line 9, column 34 in lazy_string_argument
    3. Line 9, column 9 to line 9, column 30 in lazy_string_argument
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    "a"
    is an element of Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_string_argument
    1. Line 12, column 30 to line 12, column 33 in lazy_string_argument
    2. Line 9, column 9 to line 9, column 34 in lazy_string_argument
    3. Line 9, column 9 to line 9, column 30 in lazy_string_argument
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_string_argument
    1. Line 13, column 8 to line 13, column 32 in lazy_string_argument
    2. Line 13, column 29 to line 13, column 32 in lazy_string_argument
    3. Line 9, column 9 to line 9, column 34 in lazy_string_argument
    4. Line 9, column 9 to line 9, column 30 in lazy_string_argument
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_string_argument
    1. Line 12, column 12 to line 12, column 36 in lazy_string_argument
    2. Line 12, column 33 to line 12, column 36 in lazy_string_argument
    3. Line 9, column 9 to line 9, column 34 in lazy_string_argument
    4. Line 9, column 9 to line 9, column 30 in lazy_string_argument
---*)
