(*---
description: An action predicate true on no step fails, naming it.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
---*)
---- MODULE action_predicate_unwitnessed ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Pred == x = 2 /\ x' = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [Pred |-> 0]
    2780:1 The _POSSIBLE predicate Pred at line 15, col 9 to line 15, col 23 of module action_predicate_unwitnessed was never witnessed.
    Others may be unwitnessed too; only witnessed predicates appear with a
    non-zero count in the record printed above.
    See https://explain.tlapl.us/possible-conditions for additional details.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
