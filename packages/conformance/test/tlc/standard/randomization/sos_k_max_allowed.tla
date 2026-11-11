(*---
description: k = 2^|S| passes the bound check, though the name says smaller.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_k_max_allowed ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSetOfSubsets(4, 0, {1, 2}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
