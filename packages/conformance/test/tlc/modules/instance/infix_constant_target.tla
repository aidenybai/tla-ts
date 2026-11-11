(*---
description: An infix constant is substituted by its symbol.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE infix_constant_target ----
---- MODULE I ----
CONSTANT _ ++ _
d == 1 ++ 2
====
G(a, b) == <<a, b>>
M == INSTANCE I WITH ++ <- G
Test == M!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
