(*---
description: An escape is one character in Len.
ref: tlc2/module/Sequences.java#Len
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_string_escapes ----
EXTENDS Sequences, Naturals
Test == Len("a\nb") = 3 /\ Len("\\") = 1 /\ Len("\"") = 1
====

(*--- recorded
all:
  exit: 0
---*)
