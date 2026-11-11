(*---
description: Nested disjunctions flatten left to right.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE nested_disjunction_flattens ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
A == x' = 1
B == x' = 2
C == x' = 3
Next == (A \/ (B \/ C))
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
    2217:4 2: <A line 15, col 6 to line 15, col 11 of module nested_disjunction_flattens>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
