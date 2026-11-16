(*---
description: x' \subseteq Nat on an unassigned x' fails when asked for the size of Nat.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_subseteq
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE subseteq_nat ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \subseteq Nat
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compute the number of elements in the overridden value Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 13, column 9 to line 13, column 24 in subseteq_nat
    1. Line 13, column 22 to line 13, column 24 in subseteq_nat


    Reason:
    Attempted to compute the number of elements in the overridden value Nat.
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
