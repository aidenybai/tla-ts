(*---
description: -65536*32768 is exactly -2^31.
ref: tlc2/module/Integers.java#Times
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE times_reaches_min ----
EXTENDS Integers
Test == (-65536) * 32768 = (-2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
