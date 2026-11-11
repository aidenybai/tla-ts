(*---
description: "A parameterized instance's operator may be passed by name only with its arguments applied."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE used_as_operator_argument ----
---- MODULE I ----
CONSTANT c
d == c
====
M(a) == INSTANCE I WITH c <- a
Op(x) == x
Test == Op(M(7)!d) = 7
====

(*--- recorded
all:
  exit: 0
---*)
