(*---
description: Tool evaluates a filter over an enumerable set eagerly, so a predicate error fires even though finiteness would not need it.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE is_finite_filter_predicate_evaluated_first ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet({n \in 1..3 : n \div 0 = 0})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module is_finite_filter_predicate_evaluated_first failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_finite_filter_predicate_evaluated_first
    1. Line 14, column 29 to line 14, column 32 in is_finite_filter_predicate_evaluated_first
    2. Line 12, column 9 to line 12, column 48 in is_finite_filter_predicate_evaluated_first
    3. Line 12, column 21 to line 12, column 47 in is_finite_filter_predicate_evaluated_first
    4. Line 12, column 35 to line 12, column 46 in is_finite_filter_predicate_evaluated_first
    5. Line 12, column 35 to line 12, column 42 in is_finite_filter_predicate_evaluated_first
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in is_finite_filter_predicate_evaluated_first
    1. Line 15, column 30 to line 15, column 33 in is_finite_filter_predicate_evaluated_first
    2. Line 12, column 9 to line 12, column 48 in is_finite_filter_predicate_evaluated_first
    3. Line 12, column 21 to line 12, column 47 in is_finite_filter_predicate_evaluated_first
    4. Line 12, column 35 to line 12, column 46 in is_finite_filter_predicate_evaluated_first
    5. Line 12, column 35 to line 12, column 42 in is_finite_filter_predicate_evaluated_first
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_finite_filter_predicate_evaluated_first
    1. Line 16, column 8 to line 16, column 32 in is_finite_filter_predicate_evaluated_first
    2. Line 16, column 29 to line 16, column 32 in is_finite_filter_predicate_evaluated_first
    3. Line 12, column 9 to line 12, column 48 in is_finite_filter_predicate_evaluated_first
    4. Line 12, column 21 to line 12, column 47 in is_finite_filter_predicate_evaluated_first
    5. Line 12, column 35 to line 12, column 46 in is_finite_filter_predicate_evaluated_first
    6. Line 12, column 35 to line 12, column 42 in is_finite_filter_predicate_evaluated_first
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_finite_filter_predicate_evaluated_first
    1. Line 15, column 12 to line 15, column 36 in is_finite_filter_predicate_evaluated_first
    2. Line 15, column 33 to line 15, column 36 in is_finite_filter_predicate_evaluated_first
    3. Line 12, column 9 to line 12, column 48 in is_finite_filter_predicate_evaluated_first
    4. Line 12, column 21 to line 12, column 47 in is_finite_filter_predicate_evaluated_first
    5. Line 12, column 35 to line 12, column 46 in is_finite_filter_predicate_evaluated_first
    6. Line 12, column 35 to line 12, column 42 in is_finite_filter_predicate_evaluated_first
---*)
