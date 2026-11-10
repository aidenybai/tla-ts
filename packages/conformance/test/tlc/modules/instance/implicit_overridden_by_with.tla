(*---
description: An explicit target replaces the implicit substitution.
ref: "tla2sany/semantic/SubstInNode.java#addExplicitSubstitute"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE implicit_overridden_by_with ----
---- MODULE I ----
CONSTANT c
d == c
====
c == 1
M == INSTANCE I WITH c <- 2
Test == M!d = 2
====

(*--- recorded
all:
  exit: 0
---*)
