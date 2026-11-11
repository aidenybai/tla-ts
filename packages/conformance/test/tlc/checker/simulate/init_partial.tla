(*---
description: An initial state missing a variable reports the initial-state error in simulation.
ref: tlc2/tool/Simulator.java#simulate
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE init_partial ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0
Next == x' = x /\ y' = y
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2106:1 State is not completely specified by the initial predicate:
    /\ x = 0
    /\ y = null
---*)
