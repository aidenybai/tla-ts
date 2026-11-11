(*---
description: 'A box of a state-level operator application fails with TLC_LIVE_CANNOT_HANDLE_FORMULA from the level check on the argument.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_of_state_predicate ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [](x \in Nat) /\ [][Next]_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 15, col 20 to line 15, col 28 of module box_of_state_predicate
---*)
