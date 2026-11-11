(*---
description: The built-in SUBSET may be passed as an operator argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_builtin_subset ----
Op(F(_), a) == F(a)
Test == Op(SUBSET, {}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
