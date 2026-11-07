(*---
description: An operator parameter may have two arguments.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
flags: [expression]
outcome: success
---*)
---- MODULE two_parameter_operator ----
Op(F(_, _)) == F(1, 2)
G(a, b) == <<a, b>>
Test == Op(G) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
