(*---
description: Evaluates a random bool expression, seed 262, number 5661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(<<(7 - 2147483647), (3 % 1)>>) = (Head(SubSeq(<<1, 2>>, 1, 3)) % (CHOOSE b8738 \in ({x \in 1..3 : x > 1} \cup {2, 1, 3}) : (SUBSET {1} = {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
---*)
