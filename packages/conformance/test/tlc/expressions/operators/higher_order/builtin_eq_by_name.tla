(*---
description: "= can be passed by name."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE builtin_eq_by_name ----
EXTENDS Integers
Apply2(f(_, _), a, b) == f(a, b)
Test == Apply2(=, 1, 1)
====

(*--- recorded
all:
  exit: 0
---*)
