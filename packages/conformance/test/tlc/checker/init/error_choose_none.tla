(*---
description: A CHOOSE with no witness fails inside Init.
ref: tlc2/tool/impl/Tool.java#evalAppl OPCODE_bc
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE error_choose_none ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = CHOOSE v \in {1} : v = 2
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 13, col 13 to line 13, col 36 of module error_choose_none
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 36 in error_choose_none
    1. Line 13, column 13 to line 13, column 36 in error_choose_none
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
