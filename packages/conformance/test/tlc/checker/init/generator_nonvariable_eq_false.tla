(*---
description: An equality with no variable on the left is evaluated, and a false result drops the branch.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_eq
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE generator_nonvariable_eq_false ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == UNCHANGED <<x, y>>
Init == x = 1 /\ 1 = 2 /\ PrintT("unreached") /\ y = 1
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
