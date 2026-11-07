(*---
description: Evaluates a random seq expression, seed 262, number 175.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00175 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Append(<<7, 1>>, LET b282 == 3 IN 2), LAMBDA p, q : p < q) \o (-(SubSeq(<<1, 2>>, -1, -1))[CASE TRUE -> 2 [] OTHER -> 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
---*)
