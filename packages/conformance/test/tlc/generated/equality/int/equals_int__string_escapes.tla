(*---
description: Compares int, a UserValue, with string_escapes, a StringValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) = ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int__string_escapes failed.
    Attempted to compare overridden value Int with non-overridden value:
    "a\"b\\c\n"
---*)
