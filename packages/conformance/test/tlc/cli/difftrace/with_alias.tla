(*---
description: With an ALIAS, -difftrace compares the aliased values.
ref: tlc2/output/StatePrinter.java#printInvariantViolationStateTraceState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
args:
  - -difftrace
---*)
---- MODULE with_alias ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = x + 1 /\ UNCHANGED y
Inv == x < 2
A == [p |-> x, q |-> y]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ p = 0
    /\ q = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 33 of module with_alias>
    /\ p = 1
    2217:4 3: <Next line 17, col 9 to line 17, col 33 of module with_alias>
    /\ p = 2
    /\ q = 0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
