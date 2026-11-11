(*---
description: Evaluates a random seq expression, seed 262, number 6125.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06125 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append([Append(<<1>>, 2147483647) EXCEPT ![1] = (<<1>> - 0)], Cardinality([a |-> 3, b |-> TRUE])), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06125 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
