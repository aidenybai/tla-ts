(*---
description: Evaluates a random function expression, seed 262, number 1570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SelectSeq(SubSeq(<<>>, 2, 7), LAMBDA e : e > 0), LAMBDA e : e > 0) :> ((IF FALSE THEN 1 ELSE 3 + (-1 % 2)) % ((2147483647 \div 1) \div (CHOOSE b2512 \in FALSE : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01570 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    2
---*)
