(*---
description: With both modules extended, \div floors as Integers.Divide does.
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_with_naturals_and_integers ----
EXTENDS Naturals, Integers
Test == (-1) \div 2 = -1
====

(*--- recorded
all:
  exit: 0
---*)
