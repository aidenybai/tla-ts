(*---
description: selectseq applied to string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq("a\"b\\c\n", LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    "a\"b\\c\n"
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    "a\"b\\c\n"
---*)
