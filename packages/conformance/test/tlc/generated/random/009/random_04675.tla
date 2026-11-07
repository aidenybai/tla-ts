(*---
description: Evaluates a random function expression, seed 262, number 4675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7308 \in (((2147483647 % SUBSET {1}) + CASE TRUE -> 7 [] OTHER -> 0) .. ([b7309 \in 2..1 |-> b7309])[Head(<<1, 2>>)]) |-> LET b7310 == ([a |-> b7308, b |-> FALSE]).a IN (CHOOSE b7311 \in ({2, 1, 3} \cup {1, 2}) : (TRUE \/ TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue
---*)
