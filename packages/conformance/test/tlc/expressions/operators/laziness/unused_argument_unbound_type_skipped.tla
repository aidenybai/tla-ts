(*---
description: "An argument used only in a dead branch is never evaluated."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE unused_argument_unbound_type_skipped ----
EXTENDS Integers
F(a, b) == IF a THEN 1 ELSE b
Test == F(TRUE, 1 \div 0) = 1
====

(*--- recorded
all:
  exit: 0
---*)
