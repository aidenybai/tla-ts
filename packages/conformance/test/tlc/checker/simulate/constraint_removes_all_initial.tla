(*---
description: A state constraint false in every initial state reports its own error in simulation.
ref: tlc2/tool/Simulator.java#simulate
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  CONSTRAINT Con
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE constraint_removes_all_initial ----
EXTENDS Naturals, TLC
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
