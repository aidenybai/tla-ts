(*---
description: '"NaN" passes the range check, since NaN compares FALSE both ways, and the result still has the right members.'
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_nan_passes_range_check ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(1, "NaN", {1}) \subseteq {{}, {1}}
====

(*--- recorded
all:
  exit: 0
---*)
