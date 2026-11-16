(*---
description: The built-in UNION may be passed as an operator argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_builtin_union ----
Op(F(_), a) == F(a)
Test == Op(UNION, {{1}}) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
