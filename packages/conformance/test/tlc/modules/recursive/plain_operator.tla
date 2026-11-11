(*---
description: A declared recursive operator may call itself.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE plain_operator ----
EXTENDS Naturals
RECURSIVE F(_)
F(n) == IF n = 0 THEN 0 ELSE n + F(n - 1)
Test == F(3) = 6
====

(*--- recorded
all:
  exit: 0
---*)
