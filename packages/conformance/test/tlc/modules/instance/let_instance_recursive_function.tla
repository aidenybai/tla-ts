(*---
description: "A recursive function a LET INSTANCE brings in calls itself, not a definition of the same name in the instancing module."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [instance]
includes: [FixRecursive.tla]
flags: [expression]
outcome: success
---*)
---- MODULE let_instance_recursive_function ----
EXTENDS Naturals
r == 100
Test == LET L == INSTANCE FixRecursive IN L!r[2] = 2 /\ r = 100
====

(*--- recorded
all:
  exit: 0
---*)
