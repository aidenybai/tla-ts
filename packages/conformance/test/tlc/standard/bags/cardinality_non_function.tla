(*---
description: A non-function says a function with a finite domain was expected.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE cardinality_non_function ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(3) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module cardinality_non_function failed.
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    3
init:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_non_function
    1. Line 14, column 29 to line 14, column 32 in cardinality_non_function
    2. Line 12, column 9 to line 12, column 29 in cardinality_non_function
    3. Line 12, column 9 to line 12, column 25 in cardinality_non_function
next:
  exit: 255
  transcript: |-
    2176:1 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in cardinality_non_function
    1. Line 15, column 30 to line 15, column 33 in cardinality_non_function
    2. Line 12, column 9 to line 12, column 29 in cardinality_non_function
    3. Line 12, column 9 to line 12, column 25 in cardinality_non_function
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_non_function
    1. Line 16, column 8 to line 16, column 32 in cardinality_non_function
    2. Line 16, column 29 to line 16, column 32 in cardinality_non_function
    3. Line 12, column 9 to line 12, column 29 in cardinality_non_function
    4. Line 12, column 9 to line 12, column 25 in cardinality_non_function
property:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_non_function
    1. Line 15, column 12 to line 15, column 36 in cardinality_non_function
    2. Line 15, column 33 to line 15, column 36 in cardinality_non_function
    3. Line 12, column 9 to line 12, column 29 in cardinality_non_function
    4. Line 12, column 9 to line 12, column 25 in cardinality_non_function
---*)
