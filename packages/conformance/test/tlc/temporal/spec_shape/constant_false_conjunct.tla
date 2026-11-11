(*---
description: 'A CONSTANT assigned FALSE fails with the trivial spec error, naming the constant.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CONSTANT C = FALSE
  CHECK_DEADLOCK FALSE
---*)
---- MODULE constant_false_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

CONSTANT C
Spec == C /\ Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2237:1 The spec is trivially false because C is false.
---*)
