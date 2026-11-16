(*---
description: Head converts a function with domain 1..n.
ref: tlc2/module/Sequences.java#Head
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE head_function ----
EXTENDS Sequences, Naturals
Test == Head([i \in 1..2 |-> i * 2]) = 2
====

(*--- recorded
all:
  exit: 0
---*)
