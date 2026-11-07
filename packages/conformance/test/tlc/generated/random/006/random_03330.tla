(*---
description: Evaluates a random set expression, seed 262, number 3330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) /\ (FALSE /\ TRUE)) \cup DOMAIN [<<5, 6>> EXCEPT ![1] = 3]) \ {CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> IF TRUE THEN 1 ELSE 0 [] OTHER -> (b5294 - b5294) : b5294 \in ((2 + 1) .. IF FALSE THEN 0 ELSE 7)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    1..2
    and T:
    FALSE
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    1..2
    and T:
    FALSE
    are not both enumerable
---*)
