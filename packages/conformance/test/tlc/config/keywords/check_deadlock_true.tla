(*---
description: CHECK_DEADLOCK TRUE leaves deadlock checking on.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  CHECK_DEADLOCK TRUE
---*)
---- MODULE check_deadlock_true ----
VARIABLE x
Init == x = 0
Next == x' = x /\ FALSE
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
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
