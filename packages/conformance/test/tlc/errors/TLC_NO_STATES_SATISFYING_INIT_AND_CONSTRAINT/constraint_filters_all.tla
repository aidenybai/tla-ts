(*---
description: When Init has states and CONSTRAINT rejects them all, simulation names the constraint in its message.
ref: tlc2/tool/Simulator.java#simulate
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
args:
  - -simulate
  - num=1
---*)
---- MODULE constraint_filters_all ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x
Con == x > 0
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2256:1 There is no state satisfying the initial state predicate and the state-constraint(s).
---*)
