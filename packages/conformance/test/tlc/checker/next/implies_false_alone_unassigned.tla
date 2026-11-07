(*---
description: P => Q with a false P leaves variables that only Q assigns unassigned.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_implies
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE implies_false_alone_unassigned ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x = 5 => x' = 7
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: x.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 13, col 9 to line 13, col 23 of module implies_false_alone_unassigned>
    x = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
