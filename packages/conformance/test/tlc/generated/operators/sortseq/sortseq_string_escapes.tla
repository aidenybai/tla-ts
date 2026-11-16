(*---
description: sortseq applied to string_escapes, a StringValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq("a\"b\\c\n", LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module sortseq_string_escapes failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    "a\"b\\c\n"
---*)
