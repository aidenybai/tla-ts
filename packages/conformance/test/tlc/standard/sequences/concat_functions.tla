(*---
description: \o converts functions with domain 1..n.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE concat_functions ----
EXTENDS Sequences, Naturals
Test == [i \in 1..1 |-> 7] \o [i \in 1..1 |-> 8] = <<7, 8>>
====

(*--- recorded
all:
  exit: 0
---*)
