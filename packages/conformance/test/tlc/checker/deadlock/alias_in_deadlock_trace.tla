(*---
description: The deadlock trace is printed through ALIAS.
ref: tlc2/tool/TLCTrace.java#printTrace
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  ALIAS Alias
---*)
---- MODULE alias_in_deadlock_trace ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Alias == [a |-> x + 10]
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    a = 10
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module alias_in_deadlock_trace>
    a = 11
    2217:4 3: <Next line 14, col 9 to line 14, col 27 of module alias_in_deadlock_trace>
    a = 12
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
