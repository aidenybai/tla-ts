(*---
description: Evaluates a random seq expression, seed 262, number 6504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SortSeq(SubSeq(<<1, 2>>, 1, 2147483647), LAMBDA p, q : p < q) EXCEPT ![1] = Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))], ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    2147483647
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    2147483647
---*)
