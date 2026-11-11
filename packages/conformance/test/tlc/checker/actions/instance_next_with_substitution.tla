(*---
description: An instantiated action with substitutions is one action, even if its body is a disjunction, and is located in the inner module.
ref: tlc2/tool/impl/Tool.java#getActions SubstInKind
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE instance_next_with_substitution ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
---- MODULE inner ----
VARIABLE v
InnerNext == v' = 1 \/ v' = 2
====
I == INSTANCE inner WITH v <- x
Next == I!InnerNext
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
    2217:4 2: <I!InnerNext line 19, col 1 to line 19, col 31 of module instance_next_with_substitution>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
