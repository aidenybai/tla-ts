(*---
description: bag_minus applied to string_escapes, a StringValue.
ref: tlc2/module/Bags.java#BagDiff
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_minus_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a\"b\\c\n" (-) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (-) should be a bag, but instead it is:
    "a\"b\\c\n"
    2169:0 The first argument of (-) should be a bag, but instead it is:
    "a\"b\\c\n"
---*)
