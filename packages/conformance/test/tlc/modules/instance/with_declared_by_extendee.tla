(*---
description: "WITH may target a declaration from the instanced module's extended module."
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_declared_by_extendee ----
---- MODULE J ----
CONSTANT c
d == c
====
---- MODULE I ----
EXTENDS J
====
M == INSTANCE I WITH c <- 7
Test == M!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
