(*---
description: =< and <= are spellings of \leq.
ref: tlc2/module/Naturals.java#LE
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE le_spellings ----
EXTENDS Naturals
Test == (2 =< 2) /\ (2 <= 2) /\ (2 \leq 2)
====

(*--- recorded
all:
  exit: 0
---*)
