(*---
description: A function with domain 1..n prints as a tuple.
ref: tlc2/value/impl/FcnRcdValue.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE function_as_tuple_print ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = [i \in 1..2 |-> i]
Inv == TLCGet("level") < 2
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
    2217:4 2: <Next line 14, col 9 to line 14, col 31 of module function_as_tuple_print>
    x = <<1, 2>>
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
