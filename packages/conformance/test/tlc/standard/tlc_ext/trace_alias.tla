(*---
description: Trace in an ALIAS extends the printed error trace states.
ref: tlc2/module/TLCExt.java#getTrace
features:
  - TLCExt
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS Alias
---*)
---- MODULE trace_alias ----
EXTENDS TLCExt, TLC, Naturals, Sequences
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 2
Alias == [x |-> x, len |-> Len(Trace)]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ len = 1
    2217:4 2: <Next line 17, col 9 to line 17, col 24 of module trace_alias>
    /\ x = 1
    /\ len = 2
    2217:4 3: <Next line 17, col 9 to line 17, col 24 of module trace_alias>
    /\ x = 2
    /\ len = 3
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
