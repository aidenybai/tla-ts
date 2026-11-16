(*---
description: "TLC binds its Java Int by name, so an Int in the replacing file is ignored."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [Integers.tla]
outcome: success
---*)
---- MODULE java_int_still_bound ----
EXTENDS Integers
Test == 5 \in Int
====

(*--- recorded
all:
  exit: 0
---*)
