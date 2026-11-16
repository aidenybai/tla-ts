(*---
description: WITH targets may be in any order.
ref: "tla2sany/semantic/Generator.java#processSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE with_target_order_free ----
---- MODULE I ----
CONSTANTS a, b
d == <<a, b>>
====
M == INSTANCE I WITH b <- 2, a <- 1
Test == M!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
