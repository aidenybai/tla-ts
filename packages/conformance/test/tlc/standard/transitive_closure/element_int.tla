(*---
description: An integer element gives TLC_MODULE_TRANSITIVE_CLOSURE naming it.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: evaluation-failure
includes:
  - TransitiveClosure.tla
---*)
---- MODULE element_int ----
EXTENDS TransitiveClosure
Test == Warshall({1}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
init:
  exit: 75
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in element_int
    1. Line 16, column 29 to line 16, column 32 in element_int
    2. Line 14, column 9 to line 14, column 26 in element_int
    3. Line 14, column 9 to line 14, column 21 in element_int
next:
  exit: 255
  transcript: |-
    2157:1 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in element_int
    1. Line 17, column 30 to line 17, column 33 in element_int
    2. Line 14, column 9 to line 14, column 26 in element_int
    3. Line 14, column 9 to line 14, column 21 in element_int
invariant:
  exit: 75
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in element_int
    1. Line 18, column 8 to line 18, column 32 in element_int
    2. Line 18, column 29 to line 18, column 32 in element_int
    3. Line 14, column 9 to line 14, column 26 in element_int
    4. Line 14, column 9 to line 14, column 21 in element_int
property:
  exit: 75
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in element_int
    1. Line 17, column 12 to line 17, column 36 in element_int
    2. Line 17, column 33 to line 17, column 36 in element_int
    3. Line 14, column 9 to line 14, column 26 in element_int
    4. Line 14, column 9 to line 14, column 21 in element_int
---*)
