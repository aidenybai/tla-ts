(*---
description: Head returns the first element.
ref: tlc2/module/Sequences.java#Head
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE head_tuple ----
EXTENDS Sequences, Naturals
Test == Head(<<7, 8>>) = 7
====

(*--- recorded
all:
  exit: 0
---*)
