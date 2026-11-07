(*---
description: A named INSTANCE of FiniteSets still gets the Java overrides, not the TLA+ definitions that would enumerate Seq.
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE instance_named ----
EXTENDS Naturals
M == INSTANCE FiniteSets
Test == M!IsFiniteSet({1}) /\ M!Cardinality({1, 2}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
