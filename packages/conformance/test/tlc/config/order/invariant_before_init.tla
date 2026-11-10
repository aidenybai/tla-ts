(*---
description: INVARIANT may come before INIT and NEXT.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: safety-violation
config: |
  INVARIANT Inv
  INIT Init
  NEXT Next
---*)
---- MODULE invariant_before_init ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x = 0
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
    2217:4 2: <Next line 14, col 9 to line 14, col 24 of module invariant_before_init>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
