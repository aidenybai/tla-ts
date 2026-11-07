(*---
description: Evaluates a random set expression, seed 262, number 3126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((2147483647 .. -1)) + ((CHOOSE b4995 \in {x \in 1..3 : x > 1} : TRUE) % DOMAIN <<5, 6>>)) :> (CHOOSE b4996 \in (DOMAIN (1 :> 2) \cap SubSeq(<<3, 1, 2>>, 0, 0)) : ((2 .. 2) = UNION {{2, 1, 3}, {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
