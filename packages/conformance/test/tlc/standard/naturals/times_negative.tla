(*---
description: Signs combine under Times.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE times_negative ----
EXTENDS Naturals
Test == (0 - 3) * 4 = 0 - 12 /\ (0 - 3) * (0 - 4) = 12
====

(*--- recorded
all:
  exit: 0
---*)
