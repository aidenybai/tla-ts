(*---
description: A function with empty domain is the empty sequence to Len.
ref: tlc2/value/impl/FcnRcdValue.java#toTuple
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_empty_function ----
EXTENDS Sequences, Naturals
Test == Len([x \in {} |-> 1]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
