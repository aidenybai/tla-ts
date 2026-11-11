(*---
description: Compares double_at, a FcnRcdValue, with record, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_double_at__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) = ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_double_at__record failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
