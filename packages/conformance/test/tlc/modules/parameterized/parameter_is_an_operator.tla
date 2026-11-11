(*---
description: An instance parameter may be an operator.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_is_an_operator ----
---- MODULE I ----
CONSTANT F(_)
d == F(1)
====
M(G(_)) == INSTANCE I WITH F <- G
Test == M(LAMBDA x : <<x>>)!d = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
