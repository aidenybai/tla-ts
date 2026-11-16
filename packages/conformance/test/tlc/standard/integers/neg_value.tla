(*---
description: Prefix minus negates.
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE neg_value ----
EXTENDS Integers
Test == -5 = 0 - 5 /\ -(-3) = 3
====

(*--- recorded
all:
  exit: 0
---*)
