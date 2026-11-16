(*---
description: Tail of a string is a string, the branch added in 2013.
ref: tlc2/module/Sequences.java#Tail
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE tail_string ----
EXTENDS Sequences, Naturals
Test == Tail("abc") = "bc"
====

(*--- recorded
all:
  exit: 0
---*)
