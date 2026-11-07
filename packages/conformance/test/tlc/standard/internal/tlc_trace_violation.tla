(*---
description: _TLCTrace after a violation serializes the counterexample and prints its message.
ref: tlc2/module/_TLCTrace.java#ioSerialize
features:
  - _TLCTrace
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  CONSTANT _TLCTraceFile = "trace.bin"
  CONSTANT _TLCTraceInputFile = "trace.bin"
  INVARIANT Inv
  POSTCONDITION _TLCTrace
---*)
---- MODULE tlc_trace_violation ----
EXTENDS _TLCTrace, TLC, Naturals, Sequences
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
    2217:4 2: <Next line 19, col 9 to line 19, col 24 of module tlc_trace_violation>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 24 of module tlc_trace_violation>
    x = 2
    | "CounterExample written: trace.bin"
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
