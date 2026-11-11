(*---
description: \div rounds positive quotients down.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_floor_positive ----
EXTENDS Naturals
Test == 7 \div 2 = 3 /\ 1 \div 2 = 0
====

(*--- recorded
all:
  exit: 0
---*)
