(*---
description: An empty tuple, though a sequence, is not accepted by STRING's member.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE tuple_member ----
EXTENDS TLC
Test == <<>> \in STRING
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
init:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in tuple_member
    1. Line 14, column 29 to line 14, column 32 in tuple_member
    2. Line 12, column 9 to line 12, column 23 in tuple_member
next:
  exit: 255
  transcript: |-
    2158:1 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in tuple_member
    1. Line 15, column 30 to line 15, column 33 in tuple_member
    2. Line 12, column 9 to line 12, column 23 in tuple_member
invariant:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in tuple_member
    1. Line 16, column 8 to line 16, column 32 in tuple_member
    2. Line 16, column 29 to line 16, column 32 in tuple_member
    3. Line 12, column 9 to line 12, column 23 in tuple_member
property:
  exit: 75
  transcript: |-
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2158:0 Attempted to check if the value:
    <<>>
    is an element of STRING.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in tuple_member
    1. Line 15, column 12 to line 15, column 36 in tuple_member
    2. Line 15, column 33 to line 15, column 36 in tuple_member
    3. Line 12, column 9 to line 12, column 23 in tuple_member
---*)
