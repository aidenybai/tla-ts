(*---
description: Evaluates a random record expression, seed 262, number 3821.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03821 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b6019 == (2147483647 * 2147483647) IN (0 \div <<3, 1, 2>>), b |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] = (CHOOSE r \in [a : {}] : TRUE))] EXCEPT !.a = ((Head(<<>>) \in (1 .. 2)) <=> (\A b6020 \in DOMAIN <<5, 6>> : (TRUE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03821 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
