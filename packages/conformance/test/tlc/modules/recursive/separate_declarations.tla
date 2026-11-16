(*---
description: Two RECURSIVE statements may declare the two operators separately.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE separate_declarations ----
EXTENDS Naturals
RECURSIVE Even(_)
RECURSIVE Odd(_)
Even(n) == IF n = 0 THEN TRUE ELSE Odd(n - 1)
Odd(n) == IF n = 0 THEN FALSE ELSE Even(n - 1)
Test == Even(4)
====

(*--- recorded
all:
  exit: 0
---*)
