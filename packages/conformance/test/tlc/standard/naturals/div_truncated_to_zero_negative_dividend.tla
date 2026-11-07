(*---
description: "Naturals.Divide only decrements when the truncated quotient is negative, so -1 \\div 2 gives 0, not the floor -1 that Integers.Divide gives. Real TLC bug: the result depends on whether Integers is extended."
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
  - tlc-bug
flags:
  - expression
outcome: success
---*)
---- MODULE div_truncated_to_zero_negative_dividend ----
EXTENDS Naturals
Test == (0 - 1) \div 2 = 0
====

(*--- recorded
all:
  exit: 0
---*)
