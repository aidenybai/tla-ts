(*---
description: An outer constant of the same name substitutes implicitly.
ref: "tla2sany/semantic/SubstInNode.java#constructSubst"
features: [instance]
flags: [expression]
config: |
  CONSTANT c = 7
outcome: success
---*)
---- MODULE implicit_outer_constant ----
---- MODULE I ----
CONSTANT c
d == c
====
CONSTANT c
M == INSTANCE I
Test == M!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
