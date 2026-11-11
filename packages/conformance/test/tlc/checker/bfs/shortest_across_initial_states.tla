(*---
description: With several initial states, BFS reports the violation nearest to any initial state.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE shortest_across_initial_states ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {0, 8}
Next == x' = x + 1
Inv == x < 9
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 8
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module shortest_across_initial_states>
    x = 9
    2199:0 4 states generated, 4 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
