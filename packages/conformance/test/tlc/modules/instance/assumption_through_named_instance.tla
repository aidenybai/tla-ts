(*---
description: "An assumption name is available under M!."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE assumption_through_named_instance ----
---- MODULE I ----
ASSUME A == 1 = 1
====
M == INSTANCE I
Test == M!A
====

(*--- recorded
all:
  exit: 0
---*)
