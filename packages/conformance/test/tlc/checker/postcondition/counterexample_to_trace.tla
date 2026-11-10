(*---
description: ToTrace turns a CounterExample into a tuple of records.
ref: tlc2/module/TLCExt.java#ToTrace
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
---*)
---- MODULE counterexample_to_trace ----
EXTENDS Naturals, TLC, TLCExt
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
Post == PrintT(ToTrace(CounterExample))
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
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module counterexample_to_trace>
    x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module counterexample_to_trace>
    x = 2
    | <<[x |-> 0], [x |-> 1], [x |-> 2]>>
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
