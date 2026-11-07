(*---
description: random_element applied to int_maximum, a IntValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    2147483647
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    2147483647
---*)
