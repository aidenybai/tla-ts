(*---
description: Evaluates a random seq expression, seed 262, number 1486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SortSeq(Tail(<<1>>), LAMBDA p, q : p < q) EXCEPT ![1] = ((7 < 7) <=> (\E b2376 \in {} : FALSE))] \o SubSeq(Append(SubSeq(<<3, 1, 2>>, 1, <<5, 6>>), (CHOOSE b2377 \in {1} : FALSE)), ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a, LET b2378 == Cardinality(1..3) IN ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 58 of module random_01486
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01486 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<5, 6>>
---*)
