(*---
description: Evaluates a random seq expression, seed 262, number 481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([(SubSeq(TRUE, 1, 2147483647) \o Append(<<3, 1, 2>>, -1)) EXCEPT ![1] = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
---*)
