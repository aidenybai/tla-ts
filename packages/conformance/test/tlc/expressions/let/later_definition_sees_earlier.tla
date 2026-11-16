(*---
description: "A later definition in the same LET can use an earlier one."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE later_definition_sees_earlier ----
EXTENDS Integers
Test == LET a == 1  b == a + 1  c == b + a IN c = 3
====

(*--- recorded
all:
  exit: 0
---*)
