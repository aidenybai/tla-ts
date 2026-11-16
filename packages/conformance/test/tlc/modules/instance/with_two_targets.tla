(*---
description: WITH may list several targets.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_two_targets ----
---- MODULE I ----
CONSTANTS a, b
d == <<a, b>>
====
M == INSTANCE I WITH a <- 1, b <- 2
Test == M!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
