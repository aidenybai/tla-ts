(*---
description: "TLC binds its Java Cardinality by name, so a Cardinality in the replacing file is ignored."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [FiniteSets.tla]
outcome: success
---*)
---- MODULE java_cardinality_still_bound ----
EXTENDS FiniteSets
Test == Cardinality({1, 2}) = 2 /\ FromFile = 7
====

(*--- recorded
all:
  exit: 0
---*)
