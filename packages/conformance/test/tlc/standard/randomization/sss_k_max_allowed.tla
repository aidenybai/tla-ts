(*---
description: k = 2^|S| passes.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_k_max_allowed ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(4, "0", {1, 2}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
