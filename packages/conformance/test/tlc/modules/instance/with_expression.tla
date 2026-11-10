(*---
description: WITH may substitute any constant expression.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_expression ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- {1, 2}
Test == M!d = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
