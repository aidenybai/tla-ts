(*---
description: Tail converts a function with domain 1..n.
ref: tlc2/module/Sequences.java#Tail
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE tail_function ----
EXTENDS Sequences, Naturals
Test == Tail([i \in 1..2 |-> i]) = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
