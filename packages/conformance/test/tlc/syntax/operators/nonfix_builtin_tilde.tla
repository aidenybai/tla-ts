(*---
description: ~ with parentheses is prefix applied to a parenthesized operand.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_builtin_tilde ----
Test == ~(FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
