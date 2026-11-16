(*---
description: _POSSIBLE fails under -simulate when no trace witnesses it.
ref: tlc2/tool/impl/Tool.java#checkPostConditionWithContext
outcome: assumption-violation
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Pred
args:
  - -simulate
  - num=1
  - -depth
  - "3"
---*)
---- MODULE in_simulation_unwitnessed ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Pred == x = 9
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | [Pred |-> 0]
    2780:1 The _POSSIBLE predicate Pred at line 20, col 9 to line 20, col 13 of module in_simulation_unwitnessed was never witnessed.
    Others may be unwitnessed too; only witnessed predicates appear with a
    non-zero count in the record printed above.
    See https://explain.tlapl.us/possible-conditions for additional details.
    2209:0 Progress(1) at <date>: 4 states generated, -1 distinct states found, -1 states left on queue.
---*)
