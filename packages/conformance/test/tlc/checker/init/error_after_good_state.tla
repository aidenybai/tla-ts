(*---
description: An error while the generator tries a later element prints no state, because the functor hasn't been given one.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_after_good_state ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \in {1, 2} /\ x = 1 \div (x - 2)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 42 in error_after_good_state
    1. Line 13, column 9 to line 13, column 20 in error_after_good_state
    2. Line 13, column 25 to line 13, column 42 in error_after_good_state
    3. Line 13, column 29 to line 13, column 42 in error_after_good_state
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
