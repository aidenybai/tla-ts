(*---
description: 'Two [][..]_v conjuncts fail with TLC_CANT_HANDLE_TOO_MANY_NEXT_STATE_RELS.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE two_boxes ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [][Next]_x /\ [][x' = x]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2240:1 The specification contains more than one conjunct of the form [][Next]_v,
    but TLC can handle only specifications with one next-state relation.
---*)
