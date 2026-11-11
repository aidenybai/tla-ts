(*---
description: An Init with no states reports the no-states error in simulation, unlike model checking.
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
---- MODULE no_initial_states ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {}
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 0 initial states...
    2118:1 There is no state satisfying the initial state predicate.
---*)
