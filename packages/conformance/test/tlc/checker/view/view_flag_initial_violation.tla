(*---
description: -view prints the view of a state violating an invariant initially.
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  VIEW V
args:
  - -view
---*)
---- MODULE view_flag_initial_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == x = 1
V == x + 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2107:1 Invariant Inv is violated by the initial state:
    1
---*)
