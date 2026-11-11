(*---
description: "M == INSTANCE brings its definitions under M!."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE named_no_params ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
Test == M!A = 1
====

(*--- recorded
all:
  exit: 0
---*)
