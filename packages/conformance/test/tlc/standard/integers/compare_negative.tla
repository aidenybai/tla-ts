(*---
description: Comparisons order negative integers.
ref: tlc2/module/Integers.java#LT
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE compare_negative ----
EXTENDS Integers
Test == -2 < -1 /\ -1 <= -1 /\ -1 > -2 /\ -1 >= -1
====

(*--- recorded
all:
  exit: 0
---*)
