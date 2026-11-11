(*---
description: Any has no cardinality.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE no_cardinality ----
EXTENDS TLC, FiniteSets
Test == Cardinality(Any) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module no_cardinality failed.
    2181:0 Attempted to compute cardinality of the value
    ANY
init:
  exit: 75
  transcript: |-
    1000:1 
    2181:0 Attempted to compute cardinality of the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in no_cardinality
    1. Line 14, column 29 to line 14, column 32 in no_cardinality
    2. Line 12, column 9 to line 12, column 28 in no_cardinality
    3. Line 12, column 9 to line 12, column 24 in no_cardinality
next:
  exit: 255
  transcript: |-
    2181:1 Attempted to compute cardinality of the value
    ANY
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in no_cardinality
    1. Line 15, column 30 to line 15, column 33 in no_cardinality
    2. Line 12, column 9 to line 12, column 28 in no_cardinality
    3. Line 12, column 9 to line 12, column 24 in no_cardinality
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2181:0 Attempted to compute cardinality of the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in no_cardinality
    1. Line 16, column 8 to line 16, column 32 in no_cardinality
    2. Line 16, column 29 to line 16, column 32 in no_cardinality
    3. Line 12, column 9 to line 12, column 28 in no_cardinality
    4. Line 12, column 9 to line 12, column 24 in no_cardinality
property:
  exit: 75
  transcript: |-
    1000:1 
    2181:0 Attempted to compute cardinality of the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in no_cardinality
    1. Line 15, column 12 to line 15, column 36 in no_cardinality
    2. Line 15, column 33 to line 15, column 36 in no_cardinality
    3. Line 12, column 9 to line 12, column 28 in no_cardinality
    4. Line 12, column 9 to line 12, column 24 in no_cardinality
---*)
