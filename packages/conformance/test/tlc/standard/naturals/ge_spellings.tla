(*---
description: ">= is a spelling of \\geq."
ref: tlc2/module/Naturals.java#GEQ
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE ge_spellings ----
EXTENDS Naturals
Test == (2 >= 2) /\ (2 \geq 2)
====

(*--- recorded
all:
  exit: 0
---*)
