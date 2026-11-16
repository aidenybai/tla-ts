(*---
description: A non-Boolean conjunct under ENABLED is refused while computing ENABLED.
ref: tlc2/tool/impl/Tool.java#enabledAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE non_boolean_enabled_conjunct ----
VARIABLE x
Init == x = 0
Next == x' = x
Inv == ENABLED (x' = x /\ 3)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 Attempted to compute ENABLED on a non-boolean expression.
    3
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 13 in non_boolean_enabled_conjunct
    1. Line 14, column 8 to line 14, column 28 in non_boolean_enabled_conjunct
    2. Line 14, column 17 to line 14, column 27 in non_boolean_enabled_conjunct
    3. Line 14, column 17 to line 14, column 22 in non_boolean_enabled_conjunct
    4. Line 14, column 27 to line 14, column 27 in non_boolean_enabled_conjunct
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
