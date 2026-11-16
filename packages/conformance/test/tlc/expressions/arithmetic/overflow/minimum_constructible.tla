(*---
description: "The least integer -2^31 is constructible by subtraction though not by a literal."
ref: "tlc2/module/Naturals.java#Minus"
flags: [expression]
outcome: success
---*)
---- MODULE minimum_constructible ----
EXTENDS Integers
Test == (-2147483647 - 1) + 1 = -2147483647
====

(*--- recorded
all:
  exit: 0
---*)
