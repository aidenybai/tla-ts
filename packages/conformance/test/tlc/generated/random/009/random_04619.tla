(*---
description: Evaluates a random int expression, seed 262, number 4619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (CASE (7 \in {1}) -> ({2, 1, 3} \div 3) [] OTHER -> (0 - 2147483647) = (SubSeq(<<>>, 1, 2147483647) \div (0 + 1))) THEN Head(<<(2147483647 - 0), (0 % 2147483647)>>) ELSE IF ((TRUE <=> FALSE) = (CHOOSE b7230 \in {x \in 1..3 : x > 1} : TRUE)) THEN ((FALSE - 0) + (CHOOSE b7231 \in {2, 1, 3} : FALSE)) ELSE ((1 % -1) + (0 \div 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04619 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
