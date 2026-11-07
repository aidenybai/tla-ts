(*---
description: head applied to string_escapes, a StringValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    "a\"b\\c\n"
    2283:0 The argument of Head should be a sequence, but instead it is:
    "a\"b\\c\n"
---*)
