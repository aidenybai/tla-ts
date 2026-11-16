(*---
description: "A named INSTANCE of Bags still gets the Java overrides: BagIn with count 0 is FALSE."
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bags_instance_named ----
EXTENDS TLC
M == INSTANCE Bags
Test == ~M!BagIn(1, 1 :> 0)
====

(*--- recorded
all:
  exit: 0
---*)
