(*---
description: An error in TLCSet's value argument propagates before the set.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE get_value_error_propagates ----
EXTENDS TLC, Naturals
Test == TLCSet(1, 1 \div 0)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module get_value_error_propagates failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_value_error_propagates
    1. Line 14, column 29 to line 14, column 32 in get_value_error_propagates
    2. Line 12, column 9 to line 12, column 27 in get_value_error_propagates
    3. Line 12, column 19 to line 12, column 26 in get_value_error_propagates
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in get_value_error_propagates
    1. Line 15, column 30 to line 15, column 33 in get_value_error_propagates
    2. Line 12, column 9 to line 12, column 27 in get_value_error_propagates
    3. Line 12, column 19 to line 12, column 26 in get_value_error_propagates
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_value_error_propagates
    1. Line 16, column 8 to line 16, column 32 in get_value_error_propagates
    2. Line 16, column 29 to line 16, column 32 in get_value_error_propagates
    3. Line 12, column 9 to line 12, column 27 in get_value_error_propagates
    4. Line 12, column 19 to line 12, column 26 in get_value_error_propagates
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_value_error_propagates
    1. Line 15, column 12 to line 15, column 36 in get_value_error_propagates
    2. Line 15, column 33 to line 15, column 36 in get_value_error_propagates
    3. Line 12, column 9 to line 12, column 27 in get_value_error_propagates
    4. Line 12, column 19 to line 12, column 26 in get_value_error_propagates
---*)
