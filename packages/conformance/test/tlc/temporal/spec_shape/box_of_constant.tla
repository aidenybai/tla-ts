(*---
description: 'A box of a constant-level formula is rejected too: level 0 is at most VariableLevel.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE box_of_constant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [](1 = 1) /\ [][Next]_x
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 15, col 20 to line 15, col 24 of module box_of_constant
---*)
