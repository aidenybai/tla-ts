(*---
description: "A built-in set operator can be passed by name."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE builtin_cup_by_name ----
EXTENDS Integers
Apply2(f(_, _), a, b) == f(a, b)
Test == Apply2(\cup, {1}, {2}) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
