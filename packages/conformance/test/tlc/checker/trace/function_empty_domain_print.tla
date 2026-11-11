(*---
description: A function with an empty domain prints as <<>>.
ref: tlc2/value/impl/FcnRcdValue.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE function_empty_domain_print ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = [i \in {} |-> i]
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
    2217:4 2: <Next line 14, col 9 to line 14, col 29 of module function_empty_domain_print>
    x = <<>>
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
