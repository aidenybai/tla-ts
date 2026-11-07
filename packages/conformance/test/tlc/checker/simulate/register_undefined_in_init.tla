(*---
description: A TLCGet of an unset register in Init reports the undefined message in simulation.
ref: tlc2/tool/Simulator.java#getLocalValue
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE register_undefined_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = TLCGet(1)
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2145:0 TLCGet(1) was undefined.
    2145:0 TLCGet(1) was undefined.
    2145:0 TLCGet(1) was undefined.
    2209:0 Progress(0) at <date>: 0 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 0
    Simulation using seed 4 and aril 0
---*)
