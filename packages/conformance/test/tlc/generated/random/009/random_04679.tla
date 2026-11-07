(*---
description: Evaluates a random bool expression, seed 262, number 4679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b7314 == [[a |-> 1] EXCEPT !.a = @ + 2] IN (b7314 % b7314) \div (([a |-> 1, b |-> TRUE] % 2147483647) % (2147483647 + 0))) \in (DOMAIN (<<5, 6>> @@ <<5, 6>>) \cup {b7315 \in [[x \in Nat |-> x + 1] EXCEPT ![3] = [a |-> 1, b |-> TRUE]] : (TRUE /\ FALSE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
