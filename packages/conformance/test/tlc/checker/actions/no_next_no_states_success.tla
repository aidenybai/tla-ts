(*---
description: A SPECIFICATION with no box and no initial states ends in success, because the queue is empty.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: success
config: |
  SPECIFICATION Spec
---*)
---- MODULE no_next_no_states_success ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Spec == x = 1 /\ x = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
