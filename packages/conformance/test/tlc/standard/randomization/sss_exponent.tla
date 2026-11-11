(*---
description: Java's Double.valueOf accepts an exponent.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_exponent ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(1, "1e-400", {1}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
