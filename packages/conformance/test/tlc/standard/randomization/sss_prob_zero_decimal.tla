(*---
description: A decimal string parses too.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_prob_zero_decimal ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(1, "0.0", {1}) = {{}} /\ RandomSubsetSet(1, "1.0", {1}) = {{1}}
====

(*--- recorded
all:
  exit: 0
---*)
