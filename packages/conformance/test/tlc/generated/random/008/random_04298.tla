(*---
description: Evaluates a random set expression, seed 262, number 4298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b6776 \in ({} \cup Nat) |-> (CHOOSE b6777 \in {1, 2} : TRUE)] \cap [Tail([<<3, 1, 2>> EXCEPT ![1] = -1]) EXCEPT ![1] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    <<2147483647, 2>>
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    <<2147483647, 2>>
    is enumerable
---*)
