(*---
description: A safety trace never contains a stuttering step, because a stutter gives no new state.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE trace_stuttering_absent ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Stay == x' = x
Go == x' = x + 1
Next == Stay \/ Go
Inv == x < 1
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
    2217:4 2: <Go line 15, col 7 to line 15, col 16 of module trace_stuttering_absent>
    x = 1
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
