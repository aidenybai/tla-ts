(*---
description: concat of bag, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_bag__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \o ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {<<1, 3>>, <<2, 3>>}
---*)
