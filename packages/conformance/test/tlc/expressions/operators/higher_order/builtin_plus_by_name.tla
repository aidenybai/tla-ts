(*---
description: "An infix Java operator can be passed by name."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE builtin_plus_by_name ----
EXTENDS Integers
Apply2(f(_, _), a, b) == f(a, b)
Test == Apply2(+, 1, 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
