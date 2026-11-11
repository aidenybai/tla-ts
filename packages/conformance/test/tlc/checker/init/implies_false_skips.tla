(*---
description: P => Q with a false P skips Q, so a variable that only Q assigns stays unassigned.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_implies
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE implies_false_skips ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == FALSE => x = 1
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    x = null
---*)
