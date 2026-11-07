(*---
description: Evaluates a random function expression, seed 262, number 4831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(([<<1, 2>> EXCEPT ![1] = 3] \ {b7540 \in Nat : FALSE})) :> CASE (\E b7541 \in (-1 .. [a |-> 1]) : (SUBSET {1} = Nat)) -> ((7 :> 0))[(2147483647 % 0)] [] OTHER -> (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<3, 2>>
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<3, 2>>
    is not enumerable.
---*)
