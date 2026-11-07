(*---
description: random_element applied to tuple_mixed, a TupleValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1, "a", {TRUE}>>
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1, "a", {TRUE}>>
---*)
