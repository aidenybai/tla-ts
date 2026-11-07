(*---
description: An instance parameter may be declared infix.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_infix_operator ----
---- MODULE I ----
CONSTANT F(_, _)
d == F(1, 2)
====
M(_ ++ _) == INSTANCE I WITH F <- ++
Test == M(LAMBDA a, b : <<a, b>>)!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
