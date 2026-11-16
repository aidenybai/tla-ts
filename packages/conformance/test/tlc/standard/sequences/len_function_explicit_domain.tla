(*---
description: A function whose domain is {1,2} written as a set is a sequence to Len.
ref: tlc2/value/impl/FcnRcdValue.java#toTuple
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_function_explicit_domain ----
EXTENDS Sequences, Naturals
Test == Len([i \in {1, 2} |-> i]) = 2
====

(*--- recorded
all:
  exit: 0
---*)
