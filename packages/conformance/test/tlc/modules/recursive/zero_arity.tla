(*---
description: A RECURSIVE operator may have no parameters.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE zero_arity ----
RECURSIVE F
F == 1
Test == F = 1
====

(*--- recorded
all:
  exit: 0
---*)
