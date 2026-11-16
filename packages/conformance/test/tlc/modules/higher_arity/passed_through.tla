(*---
description: An operator parameter may be passed on.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
flags: [expression]
outcome: success
---*)
---- MODULE passed_through ----
In(F(_)) == F(1)
Out(G(_)) == In(G)
Test == Out(LAMBDA a : a) = 1
====

(*--- recorded
all:
  exit: 0
---*)
