(*---
description: Base 1 runs the loop without overflow.
ref: tlc2/module/Naturals.java#Expt
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE expt_one_base_loop ----
EXTENDS Naturals
Test == 1 ^ 100000 = 1
====

(*--- recorded
all:
  exit: 0
---*)
