(*---
description: Any cannot be compared, even with itself.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE any_equals_self ----
EXTENDS TLC, Naturals
Test == Any = Any
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
init:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in any_equals_self
    1. Line 14, column 29 to line 14, column 32 in any_equals_self
    2. Line 12, column 9 to line 12, column 17 in any_equals_self
next:
  exit: 255
  transcript: |-
    2155:1 Attempted to compare ANY with the value
    ANY
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in any_equals_self
    1. Line 15, column 30 to line 15, column 33 in any_equals_self
    2. Line 12, column 9 to line 12, column 17 in any_equals_self
invariant:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in any_equals_self
    1. Line 16, column 8 to line 16, column 32 in any_equals_self
    2. Line 16, column 29 to line 16, column 32 in any_equals_self
    3. Line 12, column 9 to line 12, column 17 in any_equals_self
property:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare ANY with the value
    ANY
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in any_equals_self
    1. Line 15, column 12 to line 15, column 36 in any_equals_self
    2. Line 15, column 33 to line 15, column 36 in any_equals_self
    3. Line 12, column 9 to line 12, column 17 in any_equals_self
---*)
