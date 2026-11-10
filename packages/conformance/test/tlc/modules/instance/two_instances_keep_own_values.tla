(*---
description: Two instances of one module keep separate substitutions.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE two_instances_keep_own_values ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- 1
N == INSTANCE I WITH c <- 2
Test == M!d = 1 /\ N!d = 2
====

(*--- recorded
all:
  exit: 0
---*)
