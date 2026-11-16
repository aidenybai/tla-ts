(*---
description: Evaluates a random record expression, seed 262, number 4581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) EXCEPT ![((([a |-> 1]).a % (TRUE % 2)) - (IF FALSE THEN 0 ELSE 3 * (0 * 1)))] = (CHOOSE b7182 \in DOMAIN [b7183 \in {1, 2} |-> b7183] : (CASE FALSE -> b7182 [] OTHER -> b7182 < LET b7184 == b7182 IN b7184))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04581 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
