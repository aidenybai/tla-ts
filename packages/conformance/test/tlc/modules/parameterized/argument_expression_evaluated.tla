(*---
description: An instance argument may be an expression.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE argument_expression_evaluated ----
EXTENDS Naturals
---- MODULE I ----
CONSTANT c
d == c
====
M(a) == INSTANCE I WITH c <- a
Test == M(1 + 2)!d = 3
====

(*--- recorded
all:
  exit: 0
---*)
