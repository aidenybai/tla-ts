(*---
description: An unwitnessed _POSSIBLE after an invariant violation doesn't change the exit.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  _POSSIBLE Pred
---*)
---- MODULE after_invariant_violation ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 1
Pred == x = 9
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
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module after_invariant_violation>
    x = 1
    | [Pred |-> 0]
    2780:1 The _POSSIBLE predicate Pred at line 17, col 9 to line 17, col 13 of module after_invariant_violation was never witnessed.
    Others may be unwitnessed too; only witnessed predicates appear with a
    non-zero count in the record printed above.
    See https://explain.tlapl.us/possible-conditions for additional details.
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
