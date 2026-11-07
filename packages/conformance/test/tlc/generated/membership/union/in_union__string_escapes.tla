(*---
description: Asks whether string_escapes is in union, a UnionValue.
ref: tlc2/value/impl/UnionValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_union__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \in (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_union__string_escapes failed.
    Attempted to check equality of integer 1 with non-integer:
    "a\"b\\c\n"
---*)
