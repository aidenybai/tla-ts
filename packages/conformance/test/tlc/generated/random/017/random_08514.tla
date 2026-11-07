(*---
description: Evaluates a random int expression, seed 262, number 8514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13191 == ((-(2147483647 % <<3, 1, 2>>)) - IF (\E b13192 \in {2, 1, 3} : TRUE) THEN Cardinality({x \in 1..3 : x > 1}) ELSE CASE FALSE -> 2 [] OTHER -> 7) IN CASE ((b13191 :> b13191))[Head(<<1>>)] -> LET b13193 == (0 \div 7) IN IF FALSE THEN 1 ELSE b13193 [] OTHER -> IF (FALSE <=> TRUE) THEN (CHOOSE b13194 \in Nat : TRUE) ELSE ([a |-> 1]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
