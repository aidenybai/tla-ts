(*---
description: bag_union applied to string_escapes, a StringValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    "a\"b\\c\n"
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    "a\"b\\c\n"
---*)
