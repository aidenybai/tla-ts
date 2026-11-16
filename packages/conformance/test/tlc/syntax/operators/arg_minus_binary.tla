(*---
description: "- passed where arity 2 is expected is infix minus."
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_minus_binary ----
EXTENDS Integers
Op(F(_,_), a, b) == F(a, b)
Test == Op(-, 3, 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
