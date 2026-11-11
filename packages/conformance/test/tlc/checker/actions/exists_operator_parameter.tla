(*---
description: An action reached through \E shows its constant parameter in the trace.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exists_operator_parameter ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
A(i) == x' = i
Next == \E i \in {2, 1} : A(i)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <A(1) line 15, col 9 to line 15, col 14 of module exists_operator_parameter>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
