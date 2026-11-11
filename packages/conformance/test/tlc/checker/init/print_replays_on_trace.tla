(*---
description: Reconstructing a trace from a non-initial state re-runs Init, so a PrintT in Init prints again after the violation.
ref: tlc2/tool/impl/Tool.java#getState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE print_replays_on_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ PrintT("init")
Next == x' = x + 1
Inv == x < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    | "init"
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    | "init"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module print_replays_on_trace>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 18 of module print_replays_on_trace>
    x = 2
    | "init"
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
