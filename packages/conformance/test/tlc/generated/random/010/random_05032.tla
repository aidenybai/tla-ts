(*---
description: Evaluates a random seq expression, seed 262, number 5032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), Head(<<1>>), Len(<<1, 2>>)), Cardinality((Nat \ {x \in 1..3 : x > 1}))) EXCEPT ![1] = (-(CHOOSE b7825 \in {b7826 : b7826 \in {1}} : (1 = b7825)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05032 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
