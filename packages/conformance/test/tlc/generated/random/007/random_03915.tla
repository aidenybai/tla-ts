(*---
description: Evaluates a random record expression, seed 262, number 3915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([({([x \in 1..2 |-> x] % b6172) : b6172 \in {(1 :> 2) : b6173 \in {2, 1, 3}}} = {SortSeq(<<1>>, LAMBDA p, q : p < q), Len(<<1>>)}) EXCEPT !.a = @ + CASE [[b6174 \in {} |-> b6174] EXCEPT ![IF FALSE THEN 7 ELSE 0] = (CHOOSE b6175 \in {1, 2} : TRUE)] -> [SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (2147483647 - 1)] [] OTHER -> (([a |-> 1, b |-> TRUE]).a - ([a |-> 1, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
