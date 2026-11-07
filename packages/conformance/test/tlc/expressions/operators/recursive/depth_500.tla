(*---
description: "A recursive operator reaches a depth of 500 calls."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE depth_500 ----
EXTENDS Integers
RECURSIVE R(_)
R(n) == IF n = 0 THEN 0 ELSE 1 + R(n - 1)
Test == R(500) = 500
====

(*--- recorded
all:
  exit: 0
---*)
