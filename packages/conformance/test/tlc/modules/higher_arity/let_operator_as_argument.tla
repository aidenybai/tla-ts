(*---
description: A LET-defined operator may be passed as an argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [higher_arity]
flags: [expression]
outcome: success
---*)
---- MODULE let_operator_as_argument ----
Op(F(_)) == F(1)
Test == LET G(a) == <<a>> IN Op(G) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
