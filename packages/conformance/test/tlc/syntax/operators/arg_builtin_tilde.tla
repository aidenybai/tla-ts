(*---
description: The built-in ~ may be passed as an operator argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_builtin_tilde ----
Op(F(_), a) == F(a)
Test == Op(~, FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
