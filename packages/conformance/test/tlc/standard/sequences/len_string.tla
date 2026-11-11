(*---
description: Len of a string counts characters, a branch the TLA+ definition does not have.
ref: tlc2/module/Sequences.java#Len
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_string ----
EXTENDS Sequences, Naturals
Test == Len("abc") = 3 /\ Len("") = 0
====

(*--- recorded
all:
  exit: 0
---*)
