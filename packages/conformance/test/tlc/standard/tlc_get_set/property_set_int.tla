(*---
description: TLCSet stores a system property from the value's toString.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE property_set_int ----
EXTENDS TLC, Naturals
Test == TLCSet("-Dconformance.key", 1) /\ TLCGet("-Dconformance.key") = "1"
====

(*--- recorded
all:
  exit: 0
---*)
