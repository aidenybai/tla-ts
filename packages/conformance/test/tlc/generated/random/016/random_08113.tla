(*---
description: Evaluates a random set expression, seed 262, number 8113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12538 \in SubSeq(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), Len(Append(<<>>, <<1, 2>>)), Cardinality({b12539 \in {1, 2} : FALSE})) : Len(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08113 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<>>
    is not enumerable
---*)
