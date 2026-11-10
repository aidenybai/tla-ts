(*---
description: Tail of a one-character string is the empty string.
ref: tlc2/module/Sequences.java#Tail
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE tail_string_singleton ----
EXTENDS Sequences, Naturals
Test == Tail("a") = ""
====

(*--- recorded
all:
  exit: 0
---*)
