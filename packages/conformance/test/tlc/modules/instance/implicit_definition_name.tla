(*---
description: An outer definition of the same name substitutes implicitly.
ref: "tla2sany/semantic/SubstInNode.java#constructSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE implicit_definition_name ----
---- MODULE I ----
CONSTANT c
d == c
====
c == 7
M == INSTANCE I
Test == M!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
