(*---
description: A deadlock at depth 3 prints the three-state behavior and the counts when it was found.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE after_steps ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
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
    2217:4 2: <Next line 13, col 9 to line 13, col 27 of module after_steps>
    x = 1
    2217:4 3: <Next line 13, col 9 to line 13, col 27 of module after_steps>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
