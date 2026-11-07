(*---
description: "-. passed as an argument is prefix minus."
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_minus_dot ----
EXTENDS Integers
Op(F(_), a) == F(a)
Test == Op(-., 1) = 0 - 1
====

(*--- recorded
all:
  exit: 0
---*)
