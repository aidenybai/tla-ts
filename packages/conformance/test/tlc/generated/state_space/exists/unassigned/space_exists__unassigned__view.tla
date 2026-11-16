(*---
description: Explores init exists and next unassigned with check view.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  VIEW View
---*)
---- MODULE space_exists__unassigned__view ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == \E v \in 0..1 : x = v /\ y = v
Next == x' = x
View == 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2191:0 Finished computing initial states: 2 states generated, with 1 of them distinct at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 19, col 9 to line 19, col 14 of module space_exists__unassigned__view>
    /\ x = 0
    /\ y = null
    2199:0 3 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
