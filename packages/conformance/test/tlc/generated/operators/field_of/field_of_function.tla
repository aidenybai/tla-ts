(*---
description: field_of applied to function, a FcnRcdValue.
ref: tlc2/value/impl/RecordValue.java#select
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE field_of_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module field_of_function failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
