(*---
description: 'A temporal quantifier below a disjunction is not seen by processConfigSpec: it surfaces from liveness translation instead, or as the missing init first.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE temporal_exists_inside_disjunction ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == (\EE y : y = y) \/ (Init /\ [][Next]_x)
====

(*--- recorded
all:
  exit: 151
  transcript: 2231:1 The configuration file did not specify the initial state predicate.
---*)
