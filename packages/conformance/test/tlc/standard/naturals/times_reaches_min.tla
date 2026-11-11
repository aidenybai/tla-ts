(*---
description: -65536*32768 is exactly -2^31, the minimum, and does not overflow.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE times_reaches_min ----
EXTENDS Naturals
Test == (0 - 65536) * 32768 = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
