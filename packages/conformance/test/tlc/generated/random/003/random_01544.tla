(*---
description: Evaluates a random int expression, seed 262, number 1544.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01544 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((([<<1, 2>> EXCEPT ![1] = 2147483647] \o [<<1, 2>> EXCEPT ![1] = 7]) \ (DOMAIN [x \in Nat |-> x + 1] \ DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<2147483647, 2, 7, 2>>
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<2147483647, 2, 7, 2>>
    is not enumerable.
---*)
