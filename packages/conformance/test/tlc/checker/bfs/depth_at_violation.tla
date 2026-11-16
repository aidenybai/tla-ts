(*---
description: The depth reported at a violation is that of the deepest state written, and the state is at the frontier.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE depth_at_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 3
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
    2217:4 2: <Next line 14, col 9 to line 14, col 18 of module depth_at_violation>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 18 of module depth_at_violation>
    x = 2
    2217:4 4: <Next line 14, col 9 to line 14, col 18 of module depth_at_violation>
    x = 3
    2199:0 4 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
