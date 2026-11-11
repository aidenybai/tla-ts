(*---
description: 'Conjuncts run in order: the trivial-spec error in an earlier conjunct wins over a temporal quantifier in a later one.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE temporal_exists_after_trivial_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

No == FALSE
Spec == Init /\ No /\ \EE y : y = y
====

(*--- recorded
all:
  exit: 151
  transcript: 2237:1 The spec is trivially false because No is false.
---*)
