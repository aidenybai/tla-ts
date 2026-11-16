(*---
description: 'A literal FALSE conjunct is rejected as a trivially false spec, naming FALSE.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE false_literal_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == FALSE /\ Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2237:1 The spec is trivially false because FALSE is false.
---*)
