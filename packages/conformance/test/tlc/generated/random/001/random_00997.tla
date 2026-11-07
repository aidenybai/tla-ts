(*---
description: Evaluates a random seq expression, seed 262, number 997.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00997 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Append(SubSeq(<<1, 2>>, 3, 2), (2 * 0)), CASE (FALSE /\ TRUE) -> (2147483647 \div 2) [] OTHER -> (0 - -1)) \o Append((SubSeq(<<>>, [a |-> 1], 1) \o SubSeq(<<>>, 3, 2147483647)), IF (\E b1598 \in {1, 2} : TRUE) THEN (<<>> - 0) ELSE Head(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
