(*---
description: "A LOCAL named instance is not visible through INSTANCE, so its name may be reused."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_named_not_exported ----
---- MODULE I ----
LOCAL M == INSTANCE Naturals
A == M!+(1, 1)
====
INSTANCE I
M == 3
Test == M = 3 /\ A = 2
====

(*--- recorded
all:
  exit: 0
---*)
