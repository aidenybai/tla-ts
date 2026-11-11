(*---
description: Comparing Nat with STRING reaches Naturals.compareTo, which rejects it naming Nat.
ref: tlc2/module/Naturals.java#compareTo
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE nat_compared_with_string ----
EXTENDS TLC, Naturals
Test == Nat = STRING
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module nat_compared_with_string failed.
    2155:0 Attempted to compare Nat with the value
    STRING
init:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare Nat with the value
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_compared_with_string
    1. Line 14, column 29 to line 14, column 32 in nat_compared_with_string
    2. Line 12, column 9 to line 12, column 20 in nat_compared_with_string
next:
  exit: 255
  transcript: |-
    2155:1 Attempted to compare Nat with the value
    STRING
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in nat_compared_with_string
    1. Line 15, column 30 to line 15, column 33 in nat_compared_with_string
    2. Line 12, column 9 to line 12, column 20 in nat_compared_with_string
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare Nat with the value
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_compared_with_string
    1. Line 16, column 8 to line 16, column 32 in nat_compared_with_string
    2. Line 16, column 29 to line 16, column 32 in nat_compared_with_string
    3. Line 12, column 9 to line 12, column 20 in nat_compared_with_string
property:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare Nat with the value
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in nat_compared_with_string
    1. Line 15, column 12 to line 15, column 36 in nat_compared_with_string
    2. Line 15, column 33 to line 15, column 36 in nat_compared_with_string
    3. Line 12, column 9 to line 12, column 20 in nat_compared_with_string
---*)
