(*---
description: A function with domain 1..n is a sequence to Len.
ref: tlc2/module/Sequences.java#Len
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_function_on_interval ----
EXTENDS Sequences, Naturals
Test == Len([i \in 1..3 |-> i]) = 3
====

(*--- recorded
all:
  exit: 0
---*)
