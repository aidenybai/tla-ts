(*---
description: x \subseteq S on an assigned x drops the branch when x isn't a subset.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_subseteq
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE subseteq_after_assign_fails ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = {3} /\ x \subseteq {1, 2}
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
