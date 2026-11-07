(*---
description: A function built with @@ from 2 then 1 is a sequence to Len.
ref: tlc2/value/impl/FcnRcdValue.java#toTuple
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE len_built_out_of_order ----
EXTENDS Sequences, Naturals, TLC
Test == Len((2 :> "b") @@ (1 :> "a")) = 2
====

(*--- recorded
all:
  exit: 0
---*)
