(*---
description: A POSTCONDITION whose definition is constant is rejected in simulation as a configuration error.
ref: tlc2/tool/Simulator.java#simulate
outcome: config-error
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE postcondition_constant_rejected ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Post == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2233:1 The post condition Post cannot be a constant.
---*)
