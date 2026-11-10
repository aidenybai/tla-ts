(*---
description: A view holding an infinite set fails when TLC fingerprints the initial state.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  VIEW V
---*)
---- MODULE nonenumerable_view ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
V == <<x, Nat>>
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 TLC has found a state in which the value of a variable contains Nat
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in nonenumerable_view
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
