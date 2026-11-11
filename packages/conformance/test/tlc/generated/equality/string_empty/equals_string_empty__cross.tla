(*---
description: Compares string_empty, a StringValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_empty__cross failed.
    Attempted to check equality of string "" with non-string:
    {<<1, 3>>, <<2, 3>>}
---*)
