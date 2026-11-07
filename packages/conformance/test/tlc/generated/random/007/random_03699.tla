(*---
description: Evaluates a random int expression, seed 262, number 3699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b5843 == Cardinality({b5844 \in [a |-> 1] : TRUE}) IN ([b5845 \in {1, 2} |-> b5843] + Cardinality(1..3)) :> IF ((Nat \cup Nat) \subseteq UNION {{2, 1, 3}, {}}) THEN (CHOOSE r \in [a : {}] : TRUE) ELSE (CASE TRUE -> 7 [] OTHER -> TRUE - (2..1 % 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1]
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1]
    is not enumerable
---*)
