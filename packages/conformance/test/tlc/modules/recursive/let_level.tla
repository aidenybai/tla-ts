(*---
description: RECURSIVE may be used inside a LET.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE let_level ----
EXTENDS Naturals
Test == LET RECURSIVE F(_)
            F(n) == IF n = 0 THEN 0 ELSE F(n - 1)
        IN F(2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
