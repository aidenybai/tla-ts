(*---
description: n % 1 is 0.
ref: tlc2/module/Naturals.java#Mod
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE mod_one ----
EXTENDS Naturals
Test == 12345 % 1 = 0 /\ (0 - 2147483647 - 1) % 1 = 0
====

(*--- recorded
all:
  exit: 0
---*)
