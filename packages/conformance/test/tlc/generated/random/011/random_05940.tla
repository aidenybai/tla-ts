(*---
description: Evaluates a random function expression, seed 262, number 5940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b9153 == Len(SubSeq(<<>>, 1, 2147483647)) IN IF (b9153 < 2147483647) THEN (b9153 + b9153) ELSE LET b9154 == b9153 IN -1 :> (-(([a |-> 1, b |-> TRUE] @@ [x \in 1..2 |-> x]) \div (2147483647 % -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05940 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
