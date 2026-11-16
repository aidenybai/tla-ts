(*---
description: a..a is a singleton.
ref: tlc2/module/Naturals.java#DotDot
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE dotdot_singleton ----
EXTENDS Naturals
Test == 4..4 = {4}
====

(*--- recorded
all:
  exit: 0
---*)
