(*---
description: Evaluates a random seq expression, seed 262, number 7589.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07589 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(((SortSeq(<<>>, LAMBDA p, q : p < q) \o (<<>> \o <<>>)) \o ((2147483647 \div <<1>>) \o Cardinality(Nat))), (((1 + 1) * (2147483647 \div 2147483647)) + (Len(<<>>) * (-3))), (IF (FALSE /\ FALSE) THEN (2 + 0) ELSE (1 - 2) + Cardinality({b11678 \in {2, 1, 3} : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07589 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
