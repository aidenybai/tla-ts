(*---
description: "An instance parameter may go unused, and the argument is still required."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE unused_parameter ----
---- MODULE I ----
A == 1
====
M(x) == INSTANCE I
Test == M(5)!A = 1
====

(*--- recorded
all:
  exit: 0
---*)
