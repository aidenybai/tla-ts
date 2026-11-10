(*---
description: "Naturals.Divide floors a negative quotient too, when the Java quotient is below zero."
ref: "tlc2/module/Naturals.java#Divide"
flags: [expression]
outcome: success
---*)
---- MODULE naturals_div_floors ----
EXTENDS Naturals
Test == (0 - 7) \div 2 = 0 - 4
====

(*--- recorded
all:
  exit: 0
---*)
