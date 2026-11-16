(*---
description: Evaluates a random bool expression, seed 262, number 9485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<>>, 2, 3) \o SortSeq(<<>>, LAMBDA p, q : p < q)) \o [SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = LET b14734 == -1 IN b14734]) = ([([x \in 1..2 |-> x] @@ <<5, 6>>) EXCEPT ![LET b14735 == 2147483647 IN 2147483647] = Head(<<1>>)] @@ (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09485 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    2
---*)
