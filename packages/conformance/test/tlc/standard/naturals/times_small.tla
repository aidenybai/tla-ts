(*---
description: Times multiplies.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE times_small ----
EXTENDS Naturals
Test == 6 * 7 = 42
====

(*--- recorded
all:
  exit: 0
---*)
