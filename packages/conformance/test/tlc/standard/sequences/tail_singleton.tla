(*---
description: Tail of a singleton is empty.
ref: tlc2/module/Sequences.java#Tail
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE tail_singleton ----
EXTENDS Sequences, Naturals
Test == Tail(<<1>>) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
