(*---
description: "A module constant may take its value from a parameter by name, beside an explicit one."
ref: "tla2sany/semantic/SubstInNode.java#constructSubst"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_with_implicit_other ----
---- MODULE I ----
CONSTANTS a, b
d == <<a, b>>
====
M(a) == INSTANCE I WITH b <- 2
Test == M(1)!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
