(*---
description: A record set works.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_record_set ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSubset(2, [a : 1..3])) = 2
====

(*--- recorded
all:
  exit: 0
---*)
