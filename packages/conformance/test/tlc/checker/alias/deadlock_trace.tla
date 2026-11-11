(*---
description: An alias applies to a deadlock trace.
ref: tlc2/tool/impl/Tool.java#evalAlias
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  ALIAS A
---*)
---- MODULE deadlock_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
A == [p |-> x + 1]
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    p = 1
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module deadlock_trace>
    p = 2
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
