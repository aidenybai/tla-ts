(*---
description: A recursive operator may call itself inside a LAMBDA argument.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE recursive_call_inside_lambda ----
EXTENDS Naturals
RECURSIVE F(_)
Ap(G(_), x) == G(x)
F(n) == IF n = 0 THEN 0 ELSE Ap(LAMBDA m : F(m), n - 1)
Test == F(2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
