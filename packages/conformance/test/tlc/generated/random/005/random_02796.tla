(*---
description: Evaluates a random set expression, seed 262, number 2796.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02796 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4431 \in UNION {DOMAIN [b4432 \in {x \in 1..3 : x > 1} |-> b4432], DOMAIN [(1 :> 2) EXCEPT ![3] = 2147483647]} : (((2147483647 :> b4431) + (3 \div b4431)) \in {b4433 \in (Nat \ {1, 2}) : (\E b4434 \in {} : FALSE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 94 to line 14, col 99 of module random_02796
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02796 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
