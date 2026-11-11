(*---
description: A single state-level argument stops the expansion even if another argument is constant.
ref: tlc2/tool/impl/Tool.java#getActionsAppl
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE state_argument_one_of_two ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Op(c, v) == x' = c \/ x' = v + 1
Next == Op(5, x)
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
    2217:4 2: <Op line 16, col 9 to line 16, col 16 of module state_argument_one_of_two>
    x = 5
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
