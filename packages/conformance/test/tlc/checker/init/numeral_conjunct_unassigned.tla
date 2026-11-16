(*---
description: A numeral conjunct before all variables are assigned goes through the generator and fails on its kind.
ref: tlc2/tool/impl/Tool.java#getInitStates
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE numeral_conjunct_unassigned ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 1 /\ 5 /\ y = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 The init state relation is not a boolean expression.
    5
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 27 in numeral_conjunct_unassigned
    1. Line 13, column 9 to line 13, column 18 in numeral_conjunct_unassigned
    2. Line 13, column 9 to line 13, column 13 in numeral_conjunct_unassigned
    3. Line 13, column 18 to line 13, column 18 in numeral_conjunct_unassigned
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
