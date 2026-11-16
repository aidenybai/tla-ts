(*---
description: ToString enumerates a lazy function.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_lazy_function ----
EXTENDS TLC, Naturals
Test == ToString([i \in 1..2 |-> i]) = "<<1, 2>>"
====

(*--- recorded
all:
  exit: 0
---*)
