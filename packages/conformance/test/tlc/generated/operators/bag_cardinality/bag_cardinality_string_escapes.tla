(*---
description: bag_cardinality applied to string_escapes, a StringValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    "a\"b\\c\n"
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    "a\"b\\c\n"
---*)
