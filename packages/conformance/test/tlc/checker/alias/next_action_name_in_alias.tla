(*---
description: An alias reading TLCGet("level") sees each printed state's level.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE next_action_name_in_alias ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [l |-> TLCGet("level")]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    l = 1
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module next_action_name_in_alias>
    l = 2
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module next_action_name_in_alias>
    l = 3
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
