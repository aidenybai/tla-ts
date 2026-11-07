(*---
description: Evaluates a random int expression, seed 262, number 9786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((({1, 2} \ 1..3) \cap {b15192 \in Nat : TRUE}) \ {Head(7), CASE FALSE -> 2 [] OTHER -> 7})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    7
    2283:0 The argument of Head should be a sequence, but instead it is:
    7
---*)
