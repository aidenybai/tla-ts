(*---
description: "TLC binds its Java Len by name, so a Len in the replacing file is ignored."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [Sequences.tla]
outcome: success
---*)
---- MODULE java_len_still_bound ----
EXTENDS Sequences
Test == Len(<<1, 2>>) = 2
====

(*--- recorded
all:
  exit: 0
---*)
