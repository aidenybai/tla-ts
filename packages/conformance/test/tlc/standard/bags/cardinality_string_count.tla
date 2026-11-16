(*---
description: A string count is not a bag.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE cardinality_string_count ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(1 :> "a") = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module cardinality_string_count failed.
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    <<"a">>
init:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    <<"a">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_string_count
    1. Line 14, column 29 to line 14, column 32 in cardinality_string_count
    2. Line 12, column 9 to line 12, column 36 in cardinality_string_count
    3. Line 12, column 9 to line 12, column 32 in cardinality_string_count
next:
  exit: 255
  transcript: |-
    2176:1 Applying BagCardinality to the following value,
    which is not a bag:
    <<"a">>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in cardinality_string_count
    1. Line 15, column 30 to line 15, column 33 in cardinality_string_count
    2. Line 12, column 9 to line 12, column 36 in cardinality_string_count
    3. Line 12, column 9 to line 12, column 32 in cardinality_string_count
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    <<"a">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_string_count
    1. Line 16, column 8 to line 16, column 32 in cardinality_string_count
    2. Line 16, column 29 to line 16, column 32 in cardinality_string_count
    3. Line 12, column 9 to line 12, column 36 in cardinality_string_count
    4. Line 12, column 9 to line 12, column 32 in cardinality_string_count
property:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    <<"a">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_string_count
    1. Line 15, column 12 to line 15, column 36 in cardinality_string_count
    2. Line 15, column 33 to line 15, column 36 in cardinality_string_count
    3. Line 12, column 9 to line 12, column 36 in cardinality_string_count
    4. Line 12, column 9 to line 12, column 32 in cardinality_string_count
---*)
