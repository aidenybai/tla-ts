(*---
description: "Nat cannot be ordered against STRING."
ref: "tlc2/module/Naturals.java#compareTo"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE nat_with_string_set_incomparable ----
EXTENDS Integers, FiniteSets
Test == Cardinality({Nat, STRING}) = 2
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
    0. Line 11, column 9 to line 11, column 32 in nat_with_string_set_incomparable
    1. Line 11, column 29 to line 11, column 32 in nat_with_string_set_incomparable
    2. Line 9, column 9 to line 9, column 38 in nat_with_string_set_incomparable
    3. Line 9, column 9 to line 9, column 34 in nat_with_string_set_incomparable
next:
  exit: 75
  transcript: |-
    2155:1 Attempted to compare STRING with the value
    Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in nat_with_string_set_incomparable
    1. Line 12, column 30 to line 12, column 33 in nat_with_string_set_incomparable
    2. Line 9, column 9 to line 9, column 38 in nat_with_string_set_incomparable
    3. Line 9, column 9 to line 9, column 34 in nat_with_string_set_incomparable
invariant:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in nat_with_string_set_incomparable
    1. Line 13, column 8 to line 13, column 32 in nat_with_string_set_incomparable
    2. Line 13, column 29 to line 13, column 32 in nat_with_string_set_incomparable
    3. Line 9, column 9 to line 9, column 38 in nat_with_string_set_incomparable
    4. Line 9, column 9 to line 9, column 34 in nat_with_string_set_incomparable
property:
  exit: 75
  transcript: |-
    2155:0 Attempted to compare STRING with the value
    Nat
    2155:0 Attempted to compare STRING with the value
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in nat_with_string_set_incomparable
    1. Line 12, column 12 to line 12, column 36 in nat_with_string_set_incomparable
    2. Line 12, column 33 to line 12, column 36 in nat_with_string_set_incomparable
    3. Line 9, column 9 to line 9, column 38 in nat_with_string_set_incomparable
    4. Line 9, column 9 to line 9, column 34 in nat_with_string_set_incomparable
---*)
