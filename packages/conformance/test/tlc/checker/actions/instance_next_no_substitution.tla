(*---
description: An instance of a module with no parameters has no substitutions, so its disjuncts split as usual.
ref: tlc2/tool/impl/Tool.java#getActions SubstInKind
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE instance_next_no_substitution ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
---- MODULE inner ----
Same(v) == v
====
I == INSTANCE inner
Next == x' = I!Same(1) \/ x' = I!Same(2)
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
    2217:4 2: <Next line 19, col 9 to line 19, col 22 of module instance_next_no_substitution>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
