(*---
description: Of two unwitnessed predicates, only the first is named.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  _POSSIBLE P1
  _POSSIBLE P2
---*)
---- MODULE two_first_unwitnessed_named ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
P1 == x = 8
P2 == x = 9
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [P1 |-> 0, P2 |-> 0]
    2780:1 The _POSSIBLE predicate P1 at line 16, col 7 to line 16, col 11 of module two_first_unwitnessed_named was never witnessed.
    Others may be unwitnessed too; only witnessed predicates appear with a
    non-zero count in the record printed above.
    See https://explain.tlapl.us/possible-conditions for additional details.
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
