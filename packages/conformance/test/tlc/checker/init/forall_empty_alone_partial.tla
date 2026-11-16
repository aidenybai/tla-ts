(*---
description: \A over the empty set alone leaves x unassigned, which the functor reports.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_bf
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE forall_empty_alone_partial ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == \A v \in {} : x = 5
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2102:1 current state is not a legal state
    While working on the initial state:
    x = null
---*)
