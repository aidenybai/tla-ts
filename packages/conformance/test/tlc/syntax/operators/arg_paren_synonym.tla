(*---
description: A parenthesized synonym may be passed as an argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_paren_synonym ----
a \oplus b == a
Op(F(_,_), a, b) == F(a, b)
Test == Op((+), 1, 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
