(*---
description: Evaluates a random seq expression, seed 262, number 7132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SubSeq(Tail(<<3, 1, 2>>), (-1), Head(<<3, 1, 2>>)), Cardinality((2..1 \cap {2, 1, 3}))), (CHOOSE b10954 \in DOMAIN (2 :> 0) : ({b10955 \in Nat : TRUE} = {-1 : b10956 \in {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07132 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
---*)
