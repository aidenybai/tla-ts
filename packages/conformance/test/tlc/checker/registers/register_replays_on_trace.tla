(*---
description: "Replaying Init and Next for a trace runs their TLCSet calls again, so Init's call resets the register and the counter restarts."
ref: tlc2/module/TLCGetSet.java#TLCSet
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE register_replays_on_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ TLCSet(1, 0)
Next == x' = x + 1 /\ TLCSet(1, TLCGet(1) + 1) /\ PrintT(TLCGet(1))
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | 1
    | 2
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    | 1
    2217:4 2: <Next line 14, col 9 to line 14, col 67 of module register_replays_on_trace>
    x = 1
    | 2
    2217:4 3: <Next line 14, col 9 to line 14, col 67 of module register_replays_on_trace>
    x = 2
    | 1
    | 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
