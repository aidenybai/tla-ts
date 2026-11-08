(*---
description: A primed view fails on the initial state with the undefined identifier message.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  VIEW V
---*)
---- MODULE view_primed ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
V == x'
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    x = 0
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 15, col 6 to line 15, col 6 of module view_primed
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in view_primed
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
