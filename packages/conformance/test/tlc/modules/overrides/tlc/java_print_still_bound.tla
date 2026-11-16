(*---
description: "TLC binds its Java Print by name, so a Print in the replacing file still returns its second argument."
ref: "tlc2/tool/impl/SpecProcessor.java#processModuleOverrides"
features: [overrides]
flags: [expression]
includes: [TLC.tla]
outcome: success
---*)
---- MODULE java_print_still_bound ----
EXTENDS TLC
Test == Print("x", TRUE) /\ FromFile = 7
====

(*--- recorded
all:
  exit: 0
  transcript: '| "x"  TRUE'
---*)
