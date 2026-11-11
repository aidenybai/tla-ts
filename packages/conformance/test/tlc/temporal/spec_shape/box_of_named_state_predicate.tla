(*---
description: 'The level check also sees through a named predicate, because the application has the level of its definition.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_of_named_state_predicate ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

TypeOK == x \in Nat
Spec == Init /\ []TypeOK /\ [][Next]_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 17, col 19 to line 17, col 24 of module box_of_named_state_predicate
---*)
