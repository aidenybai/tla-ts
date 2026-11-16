(*---
description: A LET INSTANCE of a module with no definitions is legal.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
includes: [FixEmpty.tla]
outcome: success
---*)
---- MODULE let_instance_empty_module ----
Test == LET M == INSTANCE FixEmpty IN TRUE
====

(*--- recorded
all:
  exit: 0
---*)
