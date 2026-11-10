(*---
description: A declared operator may be used by another definition before its own definition.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE forward_reference_before_definition ----
RECURSIVE F
G == F
F == 1
Test == G = 1
====

(*--- recorded
all:
  exit: 0
---*)
