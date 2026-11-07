(*---
description: An operator constant may be set implicitly by name.
ref: "tla2sany/semantic/SubstInNode.java#constructSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE operator_constant_implicit ----
---- MODULE I ----
CONSTANT F(_)
d == F(1)
====
F(x) == <<x>>
M == INSTANCE I
Test == M!d = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
