(*---
description: The built-in DOMAIN may be passed as an operator argument.
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE arg_builtin_domain ----
Op(F(_), a) == F(a)
Test == Op(DOMAIN, <<1>>) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
