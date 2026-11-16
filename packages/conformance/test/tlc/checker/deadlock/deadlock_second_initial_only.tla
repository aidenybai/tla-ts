(*---
description: A deadlock in the second initial state is reported after the first state's successors are generated.
ref: tlc2/tool/ModelChecker.java#doNext
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE deadlock_second_initial_only ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x \in {1, 2}
Next == x = 1 /\ x' = x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 2
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
