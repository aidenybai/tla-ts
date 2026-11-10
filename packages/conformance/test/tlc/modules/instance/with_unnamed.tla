(*---
description: WITH works on an unnamed instance.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_unnamed ----
---- MODULE I ----
CONSTANT c
d == c
====
INSTANCE I WITH c <- 7
Test == d = 7
====

(*--- recorded
all:
  exit: 0
---*)
