(*---
description: An operator constant may be set to a named operator.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE operator_constant_with_named_op ----
---- MODULE I ----
CONSTANT F(_)
d == F(1)
====
G(x) == <<x>>
M == INSTANCE I WITH F <- G
Test == M!d = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
