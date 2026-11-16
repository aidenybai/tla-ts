(*---
description: Any = Any is an error, because AnySet.compareTo always throws.
ref: tlc2/module/AnySet.java#compareTo
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE equals_itself_fails ----
EXTENDS TLC
Test == Any = Any
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module equals_itself_fails failed.
    2155:0 Attempted to compare ANY with the value
    ANY
init:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in equals_itself_fails
    1. Line 14, column 29 to line 14, column 32 in equals_itself_fails
    2. Line 12, column 9 to line 12, column 17 in equals_itself_fails
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
    0. Line 15, column 9 to line 15, column 33 in equals_itself_fails
    1. Line 15, column 30 to line 15, column 33 in equals_itself_fails
    2. Line 12, column 9 to line 12, column 17 in equals_itself_fails
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in equals_itself_fails
    1. Line 16, column 8 to line 16, column 32 in equals_itself_fails
    2. Line 16, column 29 to line 16, column 32 in equals_itself_fails
    3. Line 12, column 9 to line 12, column 17 in equals_itself_fails
property:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in equals_itself_fails
    1. Line 15, column 12 to line 15, column 36 in equals_itself_fails
    2. Line 15, column 33 to line 15, column 36 in equals_itself_fails
    3. Line 12, column 9 to line 12, column 17 in equals_itself_fails
---*)
