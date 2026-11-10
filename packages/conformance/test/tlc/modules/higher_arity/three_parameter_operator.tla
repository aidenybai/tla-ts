(*---
description: An operator parameter may have three arguments.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
flags: [expression]
outcome: success
---*)
---- MODULE three_parameter_operator ----
Op(F(_, _, _)) == F(1, 2, 3)
Test == Op(LAMBDA a, b, c : c) = 3
====

(*--- recorded
all:
  exit: 0
---*)
