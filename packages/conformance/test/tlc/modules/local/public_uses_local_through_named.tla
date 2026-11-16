(*---
description: A public definition may use a LOCAL one through a named instance.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE public_uses_local_through_named ----
---- MODULE I ----
LOCAL Hid == 1
Pub == Hid
====
M == INSTANCE I
Test == M!Pub = 1
====

(*--- recorded
all:
  exit: 0
---*)
