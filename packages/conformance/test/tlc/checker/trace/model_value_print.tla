(*---
description: A model value prints bare, without quotes.
ref: tlc2/value/impl/ModelValue.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT M = M
---*)
---- MODULE model_value_print ----
EXTENDS Naturals, TLC
VARIABLE x
CONSTANT M
Init == x = 0
Next == x' = M
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
    2217:4 2: <Next line 16, col 9 to line 16, col 14 of module model_value_print>
    x = M
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
