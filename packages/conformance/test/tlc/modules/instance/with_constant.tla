(*---
description: WITH sets a constant.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_constant ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- 7
Test == M!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
