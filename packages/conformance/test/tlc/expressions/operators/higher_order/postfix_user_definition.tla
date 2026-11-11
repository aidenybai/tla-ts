(*---
description: "A user can define a postfix operator."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE postfix_user_definition ----
EXTENDS Integers
a ^+ == a + 1
Test == 1^+ = 2
====

(*--- recorded
all:
  exit: 0
---*)
