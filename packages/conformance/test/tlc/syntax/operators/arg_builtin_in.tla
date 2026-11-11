(*---
description: "The built-in \\in may be passed as an operator argument."
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_builtin_in ----
Op(F(_,_), a, b) == F(a, b)
Test == Op(\in, 1, {1})
====

(*--- recorded
all:
  exit: 0
---*)
