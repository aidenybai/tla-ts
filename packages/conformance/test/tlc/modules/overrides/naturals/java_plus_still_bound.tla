(*---
description: "TLC binds its Java Plus by operator name, so a + in the replacing file is ignored in favor of arithmetic."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [Naturals.tla]
outcome: success
---*)
---- MODULE java_plus_still_bound ----
EXTENDS Naturals
Test == 1 + 1 = 2
====

(*--- recorded
all:
  exit: 0
---*)
