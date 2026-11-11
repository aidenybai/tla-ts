(*---
description: -terse also leaves a state's lazy value unexpanded in a trace.
ref: tlc2/TLCGlobals.java#expand
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -terse
---*)
---- MODULE terse_trace_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = SUBSET {1, 2}
Inv == TLCGet("level") < 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 26 of module terse_trace_state>
    x = SUBSET {1, 2}
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
