(*---
description: -2^31 % (2^31-1) adds the modulus back without overflow.
ref: tlc2/module/Naturals.java#Mod
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE mod_min_by_max ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) % 2147483647 = 2147483646
====

(*--- recorded
all:
  exit: 0
---*)
