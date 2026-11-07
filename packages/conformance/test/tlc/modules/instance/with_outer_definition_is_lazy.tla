(*---
description: A substitution expression refers to outer definitions.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_outer_definition_is_lazy ----
---- MODULE I ----
CONSTANT c
d == c
====
v == 7
M == INSTANCE I WITH c <- v
Test == M!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
