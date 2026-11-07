(*---
description: An operator constant may be set to a LAMBDA.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE operator_constant_with_lambda ----
---- MODULE I ----
CONSTANT F(_)
d == F(1)
====
M == INSTANCE I WITH F <- LAMBDA x : <<x>>
Test == M!d = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
