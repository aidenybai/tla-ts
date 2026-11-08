(*---
description: Evaluates a random seq expression, seed 262, number 6145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(([a |-> 1]).a \div [[a |-> 1] EXCEPT !.a = 3]), IF (<<1>> = [x \in Nat |-> x + 1]) THEN ([x \in 1..2 |-> x])[-1] ELSE IF TRUE THEN 3 ELSE 2147483647>>, Head(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (7 % 7), IF TRUE THEN 2 ELSE 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06145 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
