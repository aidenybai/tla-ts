(*---
description: Evaluates a random int expression, seed 262, number 1377.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01377 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Append([SubSeq(<<>>, [x \in Nat |-> x + 1], -1) EXCEPT ![1] = CASE TRUE -> 1 [] OTHER -> 2], ([b2196 \in 1..3 |-> 7])[(3 - -1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 57 to line 14, col 61 of module random_01377>]
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 57 to line 14, col 61 of module random_01377>]
---*)
