(*---
description: Evaluates a random function expression, seed 262, number 9238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\E b14337 \in {0, 3} : (b14337 \in {2, 1, 3})) THEN ([<<1, 2>> EXCEPT ![1] = 3] % (0 + -1)) ELSE (-Head(<<1, 2>>)) :> ((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[(CHOOSE b14338 \in {} : FALSE)] \div (Len(<<>>) * Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09238 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
