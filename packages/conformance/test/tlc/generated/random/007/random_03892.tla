(*---
description: Evaluates a random function expression, seed 262, number 3892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((3 % 2147483647) + Cardinality({2, 1, 3})) :> ((7 * {}) \div Cardinality(2..1))) EXCEPT ![LET b6127 == (CASE FALSE -> 1 [] OTHER -> 3 - UNION {Nat, {1}}) IN LET b6128 == (1 \div b6127) IN (CHOOSE b6129 \in {x \in 1..3 : x > 1} : TRUE)] = (((7 + <<>>) \div (-2)) + ((0 * 1) + SortSeq(<<1>>, LAMBDA p, q : p < q)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03892 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
