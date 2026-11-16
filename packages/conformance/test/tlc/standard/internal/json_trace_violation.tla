(*---
description: _JsonTrace after a violation serializes the counterexample and prints its message.
ref: tla2sany/StandardModules/_JsonTrace.tla
features:
  - _JsonTrace
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  CONSTANT _JsonTraceFile = "trace.json"
  CONSTANT _JsonTraceInputFile = "trace.json"
  INVARIANT Inv
  POSTCONDITION _JsonTrace
---*)
---- MODULE json_trace_violation ----
EXTENDS _JsonTrace, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 2
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
    2217:4 2: <Next line 19, col 9 to line 19, col 24 of module json_trace_violation>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 24 of module json_trace_violation>
    x = 2
    | "CounterExample written: trace.json"
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
