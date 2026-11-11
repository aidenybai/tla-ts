(*---
description: Evaluates a random bool expression, seed 262, number 8652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq((<<3, 1, 2>> \o <<>>), LAMBDA p, q : p < q) \o (SortSeq(<<>>, LAMBDA p, q : p < q) \o <<1, 2>>)) = [a |-> (CHOOSE b13385 \in {b13386 \in <<3, 1, 2>> : FALSE} : (TRUE \/ FALSE)), b |-> ((<<1, 2>>).a = Cardinality({1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08652 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    <<3, 1, 2>>
    is not enumerable
---*)
