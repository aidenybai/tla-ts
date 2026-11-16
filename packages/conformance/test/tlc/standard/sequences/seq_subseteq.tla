(*---
description: A finite set of tuples can be included in Seq(S).
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_subseteq ----
EXTENDS Sequences, Naturals
Test == {<<1>>, <<>>} \subseteq Seq({1})
====

(*--- recorded
all:
  exit: 0
---*)
