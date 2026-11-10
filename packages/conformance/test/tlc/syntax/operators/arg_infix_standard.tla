(*---
description: An infix symbol may be passed as an operator argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_infix_standard ----
EXTENDS Naturals
Op(F(_,_), a, b) == F(a, b)
Test == Op(+, 1, 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
