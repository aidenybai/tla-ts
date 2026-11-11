(*---
description: Two negatives give a positive truncated quotient.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE div_both_negative ----
EXTENDS Naturals
Test == (0 - 7) \div (0 - 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
