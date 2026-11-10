(*---
description: A theorem name is brought by unnamed INSTANCE.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_through_unnamed_instance ----
---- MODULE I ----
THEOREM T == 1 = 1
====
INSTANCE I
Test == T
====

(*--- recorded
all:
  exit: 0
---*)
