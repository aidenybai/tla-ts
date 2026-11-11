(*---
description: -2^31 % n is computed without overflow.
ref: tlc2/module/Integers.java#Mod
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE mod_min ----
EXTENDS Integers
Test == (-2147483647 - 1) % 3 = 1 /\ (-2147483647 - 1) % 2147483647 = 2147483646
====

(*--- recorded
all:
  exit: 0
---*)
