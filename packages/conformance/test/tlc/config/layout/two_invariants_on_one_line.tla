(*---
description: INVARIANT reads names until the next keyword, so two names after one keyword both count, and the second one fails.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT A B
---*)
---- MODULE two_invariants_on_one_line ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == x < 3
B == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant B is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module two_invariants_on_one_line>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
