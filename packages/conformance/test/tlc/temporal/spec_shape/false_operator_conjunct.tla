(*---
description: 'A constant definition has already been evaluated to a value, so the lookup finds a false BoolValue and the message names the operator.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE false_operator_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

No == FALSE
Spec == Init /\ No /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2237:1 The spec is trivially false because No is false.
---*)
