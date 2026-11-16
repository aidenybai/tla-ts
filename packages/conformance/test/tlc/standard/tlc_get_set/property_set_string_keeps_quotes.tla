(*---
description: A string value keeps its quotes, since the toString of a StringValue includes them.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE property_set_string_keeps_quotes ----
EXTENDS TLC, Naturals
Test == TLCSet("-Dconformance.key", "v") /\ TLCGet("-Dconformance.key") = "\"v\""
====

(*--- recorded
all:
  exit: 0
---*)
