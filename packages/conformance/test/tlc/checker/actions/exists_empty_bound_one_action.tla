(*---
description: \E over an empty constant set still makes one action, so it can be evaluated and deadlocks.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exists_empty_bound_one_action ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Next == \E i \in {} : x' = i
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
