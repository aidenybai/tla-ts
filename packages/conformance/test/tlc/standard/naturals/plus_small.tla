(*---
description: Plus adds two small integers.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE plus_small ----
EXTENDS Naturals
Test == 2 + 3 = 5
====

(*--- recorded
all:
  exit: 0
---*)
