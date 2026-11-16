(*---
description: "A recursive call does not force an argument it never reaches."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE unused_argument_not_forced ----
EXTENDS Integers
RECURSIVE R(_, _)
R(n, junk) == IF n = 0 THEN 0 ELSE R(n - 1, 1 \div 0)
Test == R(3, 1 \div 0) = 0
====

(*--- recorded
all:
  exit: 0
---*)
