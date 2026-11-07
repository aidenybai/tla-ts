(*---
description: random_element applied to bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(SetToBag({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
---*)
