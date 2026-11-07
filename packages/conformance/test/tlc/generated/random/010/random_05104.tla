(*---
description: Evaluates a random seq expression, seed 262, number 5104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([[SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) EXCEPT ![1] = (2 % TRUE)] EXCEPT ![1] = (Head(<<3, 1, 2>>) + SortSeq(<<1, 2>>, LAMBDA p, q : p < q))], (([(1 :> 2) EXCEPT ![1] = 1] @@ ([x \in 1..2 |-> x] @@ (1 :> 2))))[IF (\E b7941 \in {1, 2} : TRUE) THEN IF TRUE THEN 2147483647 ELSE 0 ELSE IF FALSE THEN 7 ELSE 2], ([a |-> (2147483647 - 1), b |-> (FALSE <=> FALSE)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
