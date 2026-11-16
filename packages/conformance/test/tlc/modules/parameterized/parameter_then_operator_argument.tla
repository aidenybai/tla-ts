(*---
description: A definition with its own parameter takes both argument lists.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_then_operator_argument ----
---- MODULE I ----
CONSTANT c
d(x) == <<c, x>>
====
M(a) == INSTANCE I WITH c <- a
Test == M(1)!d(2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
