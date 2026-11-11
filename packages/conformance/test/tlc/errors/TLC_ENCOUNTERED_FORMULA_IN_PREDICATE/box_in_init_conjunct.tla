(*---
description: A temporal conjunct in Init reaches eval through the catch-all case, and reports the formula.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE box_in_init_conjunct ----
VARIABLE x
Init == x = 0 /\ [](x = 0)
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2261:0 TLC encountered a temporal formula ([]A) when evaluating a predicate or action.
    line 11, col 18 to line 11, col 26 of module box_in_init_conjunct
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 26 in box_in_init_conjunct
    1. Line 11, column 9 to line 11, column 13 in box_in_init_conjunct
    2. Line 11, column 18 to line 11, column 26 in box_in_init_conjunct
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
