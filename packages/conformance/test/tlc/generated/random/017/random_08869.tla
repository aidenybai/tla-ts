(*---
description: Evaluates a random seq expression, seed 262, number 8869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq([SubSeq(<<3, 1, 2>>, 0, 7) EXCEPT ![1] = (7 + 7)], LAMBDA p, q : p < q), (CHOOSE b13735 \in (({2, 1, 3} \cap {1}) \cap (3 .. 2)) : (SortSeq(<<1, 2>>, LAMBDA p, q : p < q) = [(1 :> 2) EXCEPT ![2147483647] = 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    0
---*)
