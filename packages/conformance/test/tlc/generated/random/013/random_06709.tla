(*---
description: Evaluates a random set expression, seed 262, number 6709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[[<<5, 6>> EXCEPT ![3] = 7] EXCEPT ![(-(1 :> 2))] = ((1 :> 2))[-1]] EXCEPT ![CASE ({2, 1, 3} = {1}) -> (3)[2] [] OTHER -> ([a |-> 1]).a] = LET b10286 == (1 * 2147483647) IN IF FALSE THEN b10286 ELSE 1])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 33 of module random_06709
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06709 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
