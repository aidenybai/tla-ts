(*---
description: Evaluates a random record expression, seed 262, number 348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality(UNION {Nat, {}}), b |-> ([a |-> 0, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1])] EXCEPT !.a = (CHOOSE b579 \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = -1] : ([Nat EXCEPT !.a = b579] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    Nat
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    Nat
---*)
