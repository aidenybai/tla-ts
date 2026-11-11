(*---
description: "A definition that a used one skips over is not evaluated, even between used ones."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE unused_middle_definition_in_chain ----
EXTENDS Integers
Test == LET a == 1  b == 1 \div 0  c == a + 1 IN c = 2
====

(*--- recorded
all:
  exit: 0
---*)
