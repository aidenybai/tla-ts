(*---
description: A postfix constant is substituted by its symbol.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_constant_target ----
---- MODULE I ----
CONSTANT _ ^+
d == 1^+
====
G(a) == <<a>>
M == INSTANCE I WITH ^+ <- G
Test == M!d = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
