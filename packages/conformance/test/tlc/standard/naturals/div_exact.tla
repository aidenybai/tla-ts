(*---
description: \div on exact multiples.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_exact ----
EXTENDS Naturals
Test == 6 \div 3 = 2
====

(*--- recorded
all:
  exit: 0
---*)
