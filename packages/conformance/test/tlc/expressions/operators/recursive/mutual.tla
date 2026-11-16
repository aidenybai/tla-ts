(*---
description: "RECURSIVE allows mutual recursion."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE mutual ----
EXTENDS Integers
RECURSIVE Even(_), Odd(_)
Even(n) == IF n = 0 THEN TRUE ELSE Odd(n - 1)
Odd(n) == IF n = 0 THEN FALSE ELSE Even(n - 1)
Test == Even(4) /\ Odd(3) /\ ~Even(3)
====

(*--- recorded
all:
  exit: 0
---*)
