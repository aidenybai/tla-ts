(*---
description: set_to_bag applied to string_escapes, a StringValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    "a\"b\\c\n"
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    "a\"b\\c\n"
---*)
