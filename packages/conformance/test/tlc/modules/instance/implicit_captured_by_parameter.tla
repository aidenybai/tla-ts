(*---
description: A parameter of the instance definition substitutes implicitly.
ref: "tla2sany/semantic/SubstInNode.java#constructSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE implicit_captured_by_parameter ----
---- MODULE I ----
CONSTANT c
d == c
====
M(c) == INSTANCE I
Test == M(7)!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
