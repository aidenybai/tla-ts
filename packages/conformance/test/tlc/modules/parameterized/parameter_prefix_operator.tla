(*---
description: An instance parameter may be declared prefix.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_prefix_operator ----
---- MODULE I ----
CONSTANT F(_)
d == F(1)
====
M(-. _) == INSTANCE I WITH F <- -.
Test == M(LAMBDA a : <<a>>)!d = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
