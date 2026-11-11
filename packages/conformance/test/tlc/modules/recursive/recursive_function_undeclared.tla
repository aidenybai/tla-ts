(*---
description: A function may use itself with no RECURSIVE declaration.
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE recursive_function_undeclared ----
EXTENDS Naturals
f[n \in 0..2] == IF n = 0 THEN 0 ELSE f[n - 1]
Test == f[2] = 0
====

(*--- recorded
all:
  exit: 0
---*)
