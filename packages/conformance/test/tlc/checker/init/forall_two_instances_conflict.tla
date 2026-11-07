(*---
description: "\\A v \\in {1, 2}: x = v assigns for one instance and fails the equality for the other, giving no state."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_bf
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE forall_two_instances_conflict ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == \A v \in {1, 2} : x = v
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
