(*---
description: "A constant zero-arity operator equal to FALSE drops the branch, leaving a deadlock."
ref: tlc2/tool/impl/Tool.java#getNextStatesApplUsrDefOp
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE operator_constant_false ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
C == FALSE
Next == C /\ x' = 1
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
