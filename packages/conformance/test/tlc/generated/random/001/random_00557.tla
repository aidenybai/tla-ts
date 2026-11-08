(*---
description: Evaluates a random seq expression, seed 262, number 557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SubSeq(<<0, 7>>, Cardinality({}), (2 \div 2147483647)), ((CHOOSE b944 \in {1, 2} : FALSE) - (7 % 2))), [<<(-7), Head(<<1>>)>> EXCEPT !.a = (-((1 :> 2))[2])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00557 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<0, 7>>
    , but instead it is
    0
---*)
