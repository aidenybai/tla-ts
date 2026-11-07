(*---
description: Evaluates a random int expression, seed 262, number 4667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SelectSeq(SubSeq((<<3, 1, 2>> \o <<>>), ({x \in 1..3 : x > 1} \subseteq Nat), (-1 - -1)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    TRUE
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    TRUE
---*)
