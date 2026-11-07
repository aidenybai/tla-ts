(*---
description: Evaluates a random set expression, seed 262, number 4719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), (7 - 2147483647), (2147483647 - 2))), ((CHOOSE r \in [a : {1}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, 3>>
    , but instead it is
    -2147483640
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, 3>>
    , but instead it is
    -2147483640
---*)
