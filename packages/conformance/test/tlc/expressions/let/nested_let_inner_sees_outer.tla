(*---
description: "A nested LET sees the bindings of the enclosing LET."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE nested_let_inner_sees_outer ----
EXTENDS Integers
Test == LET a == 1 IN LET b == a + 1 IN a + b = 3
====

(*--- recorded
all:
  exit: 0
---*)
