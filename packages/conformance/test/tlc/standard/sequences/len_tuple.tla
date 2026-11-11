(*---
description: Len of a tuple, including the empty one.
ref: tlc2/module/Sequences.java#Len
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_tuple ----
EXTENDS Sequences, Naturals
Test == Len(<<>>) = 0 /\ Len(<<1, 2>>) = 2
====

(*--- recorded
all:
  exit: 0
---*)
