(*---
description: Evaluates a random set expression, seed 262, number 9139.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09139 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), (<<1>> \div 0)), LAMBDA e : e > 0) \o [(SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) EXCEPT ![1] = [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (1 % 3)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09139 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
