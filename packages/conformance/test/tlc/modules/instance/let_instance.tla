(*---
description: A named INSTANCE of a standard module may be in a LET.
ref: "tla2sany/semantic/Generator.java#processLetIn"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE let_instance ----
Test == LET M == INSTANCE Naturals IN M!+(1, 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
