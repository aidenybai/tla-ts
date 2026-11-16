(*---
description: An unset -D key reads as its own text, key prefix included.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE property_default_is_key ----
EXTENDS TLC, Naturals
Test == TLCGet("-Dconformance.unset") = "-Dconformance.unset"
====

(*--- recorded
all:
  exit: 0
---*)
