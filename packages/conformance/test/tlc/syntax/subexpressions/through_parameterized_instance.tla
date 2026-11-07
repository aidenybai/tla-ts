(*---
description: A selector through a parameterized instance keeps the argument.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE through_parameterized_instance ----
---- MODULE I ----
CONSTANT c
Op == c = 1
====
M(a) == INSTANCE I WITH c <- a
Test == M(7)!Op!1 = 7
====

(*--- recorded
all:
  exit: 0
---*)
