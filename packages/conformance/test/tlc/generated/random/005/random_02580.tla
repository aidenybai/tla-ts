(*---
description: Evaluates a random set expression, seed 262, number 2580.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02580 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail(SubSeq(<<>>, 1, 1))) .. ((([a |-> 1, b |-> TRUE]).a \div LET b4062 == 3 IN 3) - LET b4063 == ([x \in Nat |-> x + 1])[-1] IN (b4063 % 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
