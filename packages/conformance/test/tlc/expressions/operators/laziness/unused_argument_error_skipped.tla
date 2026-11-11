(*---
description: "A user operator does not evaluate an argument its body does not reach."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE unused_argument_error_skipped ----
EXTENDS Integers
F(a) == 1
Test == F(1 \div 0) = 1
====

(*--- recorded
all:
  exit: 0
---*)
