(*---
description: M(a) == INSTANCE substitutes the argument.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE one_parameter ----
---- MODULE I ----
CONSTANT c
d == c
====
M(a) == INSTANCE I WITH c <- a
Test == M(7)!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
