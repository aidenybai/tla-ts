(*---
description: "With x' bound to a new value, (x + 1)' = x + 1 is false, so the action is disabled and TLC reports a deadlock."
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [variables]
config: |
  INIT Init
  NEXT Next
outcome: deadlock
---*)
---- MODULE expression_for_variable_prime_false_deadlocks ----
EXTENDS Naturals
---- MODULE I ----
VARIABLE v
Same == v' = v
Stay == UNCHANGED v
====
VARIABLE x
M == INSTANCE I WITH v <- x + 1
Init == x = 0
Next == x' = 1 - x /\ M!Same
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
