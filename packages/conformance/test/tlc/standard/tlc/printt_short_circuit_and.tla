(*---
description: A FALSE conjunct stops later ones from printing.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_short_circuit_and ----
EXTENDS TLC, Naturals
Test == ~(FALSE /\ PrintT("not printed"))
====

(*--- recorded
all:
  exit: 0
---*)
