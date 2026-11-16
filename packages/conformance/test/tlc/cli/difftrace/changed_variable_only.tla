(*---
description: -difftrace prints the first state in full, and later states with only what changed.
ref: tlc2/output/StatePrinter.java#printInvariantViolationStateTraceState
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -difftrace
---*)
---- MODULE changed_variable_only ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x' = x + 1 /\ UNCHANGED y
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
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 33 of module changed_variable_only>
    /\ x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 33 of module changed_variable_only>
    /\ x = 2
    /\ y = 0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
