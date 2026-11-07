(*---
description: Evaluates a random set expression, seed 262, number 9784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([[a |-> 1] EXCEPT !.a = @ + 1] = [[a |-> 1] EXCEPT !.a = 3]) THEN ([b15191 \in SUBSET {1} |-> 2])[CASE TRUE -> 2147483647 [] OTHER -> 3] ELSE Cardinality(UNION {-1, {2, 1, 3}}) .. ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = (2147483647 + 2)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2, 3} with the value:
    -1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2, 3} with the value:
    -1
---*)
