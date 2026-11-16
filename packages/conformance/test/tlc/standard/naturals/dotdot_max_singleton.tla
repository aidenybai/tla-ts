(*---
description: An interval ending at the maximum integer works.
ref: tlc2/module/Naturals.java#DotDot
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE dotdot_max_singleton ----
EXTENDS Naturals
Test == 2147483647 \in 2147483647..2147483647
====

(*--- recorded
all:
  exit: 0
---*)
