(*---
description: "A LET can nest in another LET definition."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE let_in_definition_body ----
EXTENDS Integers
Test == LET a == LET b == 2 IN b * b IN a = 4
====

(*--- recorded
all:
  exit: 0
---*)
