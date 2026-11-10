(*---
description: "TLC binds its Java Nat by operator name, so a Nat in the replacing file is ignored."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [Naturals.tla]
outcome: success
---*)
---- MODULE java_nat_still_bound ----
EXTENDS Naturals
Test == 5 \in Nat
====

(*--- recorded
all:
  exit: 0
---*)
