(*---
description: Evaluates a random seq expression, seed 262, number 2693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SortSeq((<<1>> \o <<>>), LAMBDA p, q : p < q), IF (2 < 3) THEN Tail(<<3, 1, 2>>) ELSE (7 % -1)), IF ((2 - 2147483647) = (-1 * 2147483647)) THEN (-([x \in Nat |-> x + 1])[3]) ELSE Cardinality(UNION {Nat, {1}}), Len(Tail(SubSeq(<<>>, -1, 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1} with the value:
    Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1} with the value:
    Nat
---*)
