(*---
description: "A user-defined infix operator can be passed by name."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE infix_definition_by_name ----
EXTENDS Integers
Apply2(f(_, _), a, b) == f(a, b)
a ++ b == a * 10 + b
Test == Apply2(++, 1, 2) = 12
====

(*--- recorded
all:
  exit: 0
---*)
