(*---
description: TLCGet("all:named") in simulation maps each key to a tuple with a value per worker.
ref: tlc2/tool/Simulator.java#getAllNamedRegisterValues
outcome: success
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE all_named_values ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ TLCSet("s:reg", 7)
Next == x' = x /\ PrintT(TLCGet("all:named"))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | ("s:reg" :> <<7>>)
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
---*)
