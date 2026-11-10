(*---
description: A selector through an instance keeps the substitution.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE through_instance_with_substitution ----
---- MODULE I ----
CONSTANT c
Op == c = 1
====
M == INSTANCE I WITH c <- 7
Test == M!Op!1 = 7
====

(*--- recorded
all:
  exit: 0
---*)
