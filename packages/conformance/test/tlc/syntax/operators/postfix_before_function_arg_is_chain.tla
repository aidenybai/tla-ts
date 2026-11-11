(*---
description: "A function application may follow a postfix operator, and applies to the postfix result."
ref: "tla2sany/parser/Operators.java#CanonicalOperators"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_before_function_arg_is_chain ----
a ^+ == a
Test == <<5>>^+[1] = 5
====

(*--- recorded
all:
  exit: 0
---*)
