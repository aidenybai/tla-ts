(*---
description: Evaluates a random seq expression, seed 262, number 8577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SelectSeq((3 * 1), LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = LET b13290 == (CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE) IN ((b13290 % 3) + Len(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    3
---*)
