(*---
description: Evaluates a random seq expression, seed 262, number 8612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((CASE (\A b13339 \in {x \in 1..3 : x > 1} : TRUE) -> (3 \div 2147483647) [] OTHER -> (2 - 2147483647) + Head(SubSeq(<<3, 1, 2>>, 2, 7))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    0
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    0
---*)
