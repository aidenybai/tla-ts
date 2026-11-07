(*---
description: Membership of a set in Nat is an error.
ref: tlc2/module/Naturals.java#member
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE nat_set_member ----
EXTENDS Naturals
Test == {1} \in Nat
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_set_member
    1. Line 14, column 29 to line 14, column 32 in nat_set_member
    2. Line 12, column 9 to line 12, column 19 in nat_set_member
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    {1}
    is an element of Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in nat_set_member
    1. Line 15, column 30 to line 15, column 33 in nat_set_member
    2. Line 12, column 9 to line 12, column 19 in nat_set_member
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_set_member
    1. Line 16, column 8 to line 16, column 32 in nat_set_member
    2. Line 16, column 29 to line 16, column 32 in nat_set_member
    3. Line 12, column 9 to line 12, column 19 in nat_set_member
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {1}
    is an element of Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_set_member
    1. Line 15, column 12 to line 15, column 36 in nat_set_member
    2. Line 15, column 33 to line 15, column 36 in nat_set_member
    3. Line 12, column 9 to line 12, column 19 in nat_set_member
---*)
