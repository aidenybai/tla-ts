(*---
description: apply of function, a FcnRcdValue, and string_empty, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2])[""])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function__string_empty failed.
    Attempted to check equality of integer 1 with non-integer:
    ""
---*)
