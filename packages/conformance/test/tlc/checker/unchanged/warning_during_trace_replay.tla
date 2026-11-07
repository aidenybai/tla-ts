(*---
description: A warning printed while generating successors prints again when the trace is reconstructed, because reconstruction reruns the action.
ref: tlc2/tool/impl/Tool.java#getState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE warning_during_trace_replay ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
A == x' = 5 /\ UNCHANGED x /\ y' = 0
B == y' = 1 /\ UNCHANGED x
Next == A \/ B
Inv == y = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2143:3 The variable x was changed while it is specified as UNCHANGED at
    line 14, col 26 to line 14, col 26 of module warning_during_trace_replay
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <B line 15, col 6 to line 15, col 26 of module warning_during_trace_replay>
    /\ x = 0
    /\ y = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
