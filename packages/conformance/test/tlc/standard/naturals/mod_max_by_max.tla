(*---
description: The maximum modulo itself is 0.
ref: tlc2/module/Naturals.java#Mod
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE mod_max_by_max ----
EXTENDS Naturals
Test == 2147483647 % 2147483647 = 0
====

(*--- recorded
all:
  exit: 0
---*)
