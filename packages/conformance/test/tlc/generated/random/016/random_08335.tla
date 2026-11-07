(*---
description: Evaluates a random bool expression, seed 262, number 8335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b12894 \in (UNION {Nat, Nat} .. (-2)) : SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0)) = (((~TRUE) => ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) \div IF (TRUE <=> TRUE) THEN (2147483647 * 2147483647) ELSE (CHOOSE b12895 \in Nat : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UnionValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UnionValue to tlc2.value.impl.IntValue
---*)
