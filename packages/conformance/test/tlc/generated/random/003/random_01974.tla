(*---
description: Evaluates a random bool expression, seed 262, number 1974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (<<>> = [x \in 1..2 |-> x]) -> LET b3125 == -1 IN 0 [] OTHER -> (2 * 2) + (LET b3126 == 0 IN {2, 1, 3} \div (1 % FALSE))) < (LET b3127 == (-<<1>>) IN LET b3128 == 3 IN 0 % (IF FALSE THEN 2 ELSE 2 - (0 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01974 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
