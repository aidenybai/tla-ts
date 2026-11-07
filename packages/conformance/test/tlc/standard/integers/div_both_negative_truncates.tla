(*---
description: Two negatives give a positive quotient rounded down.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE div_both_negative_truncates ----
EXTENDS Integers
Test == (-7) \div (-2) = 3 /\ (-1) \div (-2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
