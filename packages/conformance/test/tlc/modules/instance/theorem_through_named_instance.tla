(*---
description: "A theorem name is available under M!."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_through_named_instance ----
---- MODULE I ----
THEOREM T == 1 = 1
====
M == INSTANCE I
Test == M!T
====

(*--- recorded
all:
  exit: 0
---*)
