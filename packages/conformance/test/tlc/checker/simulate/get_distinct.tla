(*---
description: TLCGet("distinct") in simulation has no main checker, so it fails with the undefined message.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "2"
---*)
---- MODULE get_distinct ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1 /\ PrintT(TLCGet("distinct"))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2145:0 TLCGet(distinct) was undefined.
    2145:0 TLCGet(distinct) was undefined.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module get_distinct>
    x = 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
