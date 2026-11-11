(*---
description: Tail drops the first element.
ref: tlc2/module/Sequences.java#Tail
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE tail_tuple ----
EXTENDS Sequences, Naturals
Test == Tail(<<1, 2, 3>>) = <<2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
