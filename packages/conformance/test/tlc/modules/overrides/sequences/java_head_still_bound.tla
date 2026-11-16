(*---
description: "TLC binds its Java Head by name, so a Head in the replacing file is ignored."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [Sequences.tla]
outcome: success
---*)
---- MODULE java_head_still_bound ----
EXTENDS Sequences
Test == Head(<<1, 2>>) = 1
====

(*--- recorded
all:
  exit: 0
---*)
