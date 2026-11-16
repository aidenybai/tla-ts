(*---
description: A tuple is stored by its toString.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE property_set_tuple ----
EXTENDS TLC, Naturals
Test == TLCSet("-Dconformance.key", <<1, 2>>) /\ TLCGet("-Dconformance.key") = "<<1, 2>>"
====

(*--- recorded
all:
  exit: 0
---*)
