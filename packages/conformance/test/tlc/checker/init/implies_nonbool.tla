(*---
description: P => Q with a non-Boolean P has its own message.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_implies
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE implies_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == 1 => x = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 In computing initial states of a predicate of form P => Q, P was an integer
    .line 13, col 9 to line 13, col 18 of module implies_nonbool
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 18 in implies_nonbool
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
