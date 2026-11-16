(*---
description: An alias applies to a trace for a false implied action.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: liveness-violation
config: |
  INIT Init
  NEXT Next
  PROPERTY Prop
  ALIAS A
---*)
---- MODULE action_property_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Prop == [][x' < 2]_x
A == [p |-> x + 1]
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    p = 1
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module action_property_trace>
    p = 2
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module action_property_trace>
    p = 3
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
