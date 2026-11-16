(*---
description: "A LET binding is lexical, so an operator body does not see the callers LET names."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE let_body_shadow_free_by_operator_call ----
EXTENDS Integers
F(z) == LET w == z + 1 IN w
Test == LET w == 10 IN F(w) = 11
====

(*--- recorded
all:
  exit: 0
---*)
