(*---
description: Evaluates a random record expression, seed 262, number 9391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (Nat - 2147483647), CASE TRUE -> 2 [] OTHER -> -1), (IF {1, 2} THEN 2 ELSE 1 - Head(<<1, 2>>)), Cardinality(UNION {{1}, [a |-> 1, b |-> TRUE]})) EXCEPT !.a = @ + (CHOOSE b14570 \in (({1, 2} \cup SUBSET {1}) \cup ([x \in Nat |-> x + 1])[-1]) : ((~TRUE) => (FALSE => TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09391 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)
