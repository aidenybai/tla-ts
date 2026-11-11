(*---
description: Java's Double.valueOf accepts a d suffix.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_type_suffix ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(1, "1d", {1}) = {{1}}
====

(*--- recorded
all:
  exit: 0
---*)
