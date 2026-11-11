(*---
description: With another variable still unassigned, x \subseteq S on an assigned x drops a non-subset in the generator.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_subseteq
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE generator_subseteq_not_member ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = {3} /\ x \subseteq {1, 2} /\ PrintT("unreached") /\ y = 1
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
