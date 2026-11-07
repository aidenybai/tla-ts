(*---
description: head applied to string_empty, a StringValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(""))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    ""
    2283:0 The argument of Head should be a sequence, but instead it is:
    ""
---*)
