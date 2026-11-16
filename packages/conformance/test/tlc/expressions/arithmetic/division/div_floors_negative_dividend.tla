(*---
description: "\\div floors, unlike Java division."
ref: "tlc2/module/Integers.java#Divide"
flags: [expression]
outcome: success
---*)
---- MODULE div_floors_negative_dividend ----
EXTENDS Integers
Test == (-7) \div 2 = -4
====

(*--- recorded
all:
  exit: 0
---*)
