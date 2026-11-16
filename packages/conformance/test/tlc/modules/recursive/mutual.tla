(*---
description: Mutually recursive operators are declared together.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE mutual ----
EXTENDS Naturals
RECURSIVE Even(_), Odd(_)
Even(n) == IF n = 0 THEN TRUE ELSE Odd(n - 1)
Odd(n) == IF n = 0 THEN FALSE ELSE Even(n - 1)
Test == Even(4) /\ Odd(3)
====

(*--- recorded
all:
  exit: 0
---*)
