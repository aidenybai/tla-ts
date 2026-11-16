(*---
description: "The built-in \\cup may be passed as an operator argument."
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_builtin_cup ----
Op(F(_,_), a, b) == F(a, b)
Test == Op(\cup, {1}, {2}) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
