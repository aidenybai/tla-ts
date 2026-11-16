(*---
description: A violated invariant through an instance reports its value on the replaced variable.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [variables]
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
outcome: safety-violation
---*)
---- MODULE state_function_read_violated ----
EXTENDS Naturals
---- MODULE Counter ----
EXTENDS Naturals
VARIABLE v
Init0 == v = 0
Step == v' = (v + 1) % 3
Pos == v >= 0
Double == 2 * v
====
VARIABLE x
M == INSTANCE Counter WITH v <- x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == M!Double < 4
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
    2217:4 2: <Next line 24, col 9 to line 24, col 24 of module state_function_read_violated>
    x = 1
    2217:4 3: <Next line 24, col 9 to line 24, col 24 of module state_function_read_violated>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
