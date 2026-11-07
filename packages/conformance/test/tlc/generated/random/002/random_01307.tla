(*---
description: Evaluates a random seq expression, seed 262, number 1307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Append(Append(<<>>, TRUE), Head(<<1, 2>>)) * (IF FALSE THEN 1 ELSE -1 + Cardinality({x \in 1..3 : x > 1}))), CASE ((<<5, 6>>)[-1] \in UNION {{1}, {x \in 1..3 : x > 1}}) -> LET b2075 == LET b2076 == 1 IN b2076 IN Head(<<3, 1, 2>>) [] OTHER -> (CHOOSE b2077 \in DOMAIN (1 :> 2) : (TRUE \/ FALSE))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
