(*---
description: "A RECURSIVE operator computes through self-reference."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE simple ----
EXTENDS Integers
RECURSIVE Sum(_)
Sum(n) == IF n = 0 THEN 0 ELSE n + Sum(n - 1)
Test == Sum(4) = 10
====

(*--- recorded
all:
  exit: 0
---*)
