(*---
description: "A user infix definition without EXTENDS Naturals defines + itself."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE infix_user_definition ----
EXTENDS TLC
a + b == 7
Test == 1 + 2 = 7
====

(*--- recorded
all:
  exit: 0
---*)
