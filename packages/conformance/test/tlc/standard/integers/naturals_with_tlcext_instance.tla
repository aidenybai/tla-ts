(*---
description: "TLCExt's LOCAL INSTANCE Integers loads tlc2.module.Integers, which replaces the Naturals override of \\div even for a spec extending only Naturals: 0-1 \\div 2 floors to -1."
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE naturals_with_tlcext_instance ----
EXTENDS Naturals, TLCExt
Test == (0 - 1) \div 2 = 0 - 1
====

(*--- recorded
all:
  exit: 0
---*)
