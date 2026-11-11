(*---
description: An instance argument may be a bound name.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE argument_bound_name ----
---- MODULE I ----
CONSTANT c
d == c
====
M(a) == INSTANCE I WITH c <- a
Test == \A x \in {1, 2} : M(x)!d = x
====

(*--- recorded
all:
  exit: 0
---*)
