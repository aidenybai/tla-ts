(*---
description: With only Naturals extended, Minus still yields negative integers.
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE minus_negative_result ----
EXTENDS Naturals
Test == 3 - 5 = 0 - 2 /\ (3 - 5) + 5 = 3
====

(*--- recorded
all:
  exit: 0
---*)
