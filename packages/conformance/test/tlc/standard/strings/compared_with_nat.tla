(*---
description: Comparing STRING with Nat reaches Strings.compareTo, which rejects it.
ref: tlc2/module/Strings.java#compareTo
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE compared_with_nat ----
EXTENDS TLC, Naturals
Test == STRING = Nat
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
init:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in compared_with_nat
    1. Line 14, column 29 to line 14, column 32 in compared_with_nat
    2. Line 12, column 9 to line 12, column 20 in compared_with_nat
next:
  exit: 255
  transcript: |-
    2155:1 Attempted to compare STRING with the value
    Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in compared_with_nat
    1. Line 15, column 30 to line 15, column 33 in compared_with_nat
    2. Line 12, column 9 to line 12, column 20 in compared_with_nat
invariant:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in compared_with_nat
    1. Line 16, column 8 to line 16, column 32 in compared_with_nat
    2. Line 16, column 29 to line 16, column 32 in compared_with_nat
    3. Line 12, column 9 to line 12, column 20 in compared_with_nat
property:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in compared_with_nat
    1. Line 15, column 12 to line 15, column 36 in compared_with_nat
    2. Line 15, column 33 to line 15, column 36 in compared_with_nat
    3. Line 12, column 9 to line 12, column 20 in compared_with_nat
---*)
