(*---
description: A function may be defined for a parameterless RECURSIVE declaration.
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE recursive_function_declared ----
EXTENDS Naturals
RECURSIVE f
f[n \in 0..2] == IF n = 0 THEN 0 ELSE f[n - 1]
Test == f[2] = 0
====

(*--- recorded
all:
  exit: 0
---*)
