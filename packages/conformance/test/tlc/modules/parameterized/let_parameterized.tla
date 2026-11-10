(*---
description: A parameterized instance may be in a LET.
ref: "tla2sany/semantic/Generator.java#processLetIn"
features: [parameterized]
flags: [expression]
includes: [FixConst.tla]
outcome: success
---*)
---- MODULE let_parameterized ----
Test == LET M(a) == INSTANCE FixConst WITH c <- a IN M(7)!d = 7
====

(*--- recorded
all:
  exit: 0
---*)
