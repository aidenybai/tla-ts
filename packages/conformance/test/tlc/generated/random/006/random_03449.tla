(*---
description: Evaluates a random bool expression, seed 262, number 3449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2) + {x \in 1..3 : x > 1}) :> IF FALSE THEN 3 ELSE 1))[((3 % (1 :> 2)) + (0 \div 0))] = LET b5467 == Head(Tail(<<1>>)) IN {CASE TRUE -> b5467 [] OTHER -> -1, LET b5468 == 1 IN 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03449 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
