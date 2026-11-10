(*---
description: A postfix operator applies to the whole primary before it.
ref: "tla2sany/parser/Operators.java#CanonicalOperators"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_binds_before_function_arg ----
a ^+ == a
Test == <<5>>[1]^+ = 5
====

(*--- recorded
all:
  exit: 0
---*)
