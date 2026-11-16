(*---
description: Append converts a function with domain 1..n.
ref: tlc2/module/Sequences.java#Append
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE append_function ----
EXTENDS Sequences, Naturals
Test == Append([i \in 1..1 |-> 5], 6) = <<5, 6>>
====

(*--- recorded
all:
  exit: 0
---*)
