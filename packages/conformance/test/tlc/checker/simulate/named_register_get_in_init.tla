(*---
description: A TLCGet of a named register in Init reads the first worker's value.
ref: tlc2/tool/Simulator.java#getLocalNamedValue
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
---- MODULE named_register_get_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ TLCSet("s:reg", 7) /\ PrintT(TLCGet("s:reg"))
Next == x' = x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 7
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
---*)
