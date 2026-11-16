(*---
description: A LET may hold mutually recursive operators.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
flags: [expression]
outcome: success
---*)
---- MODULE let_mutual ----
EXTENDS Naturals
Test == LET RECURSIVE A(_), B(_)
            A(n) == IF n = 0 THEN 0 ELSE B(n - 1)
            B(n) == IF n = 0 THEN 1 ELSE A(n - 1)
        IN A(1) = 1
====

(*--- recorded
all:
  exit: 0
---*)
