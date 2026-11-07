(*---
description: Evaluates a random record expression, seed 262, number 9788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(({1, [x \in 1..2 |-> x]} \cup DOMAIN [x \in Nat |-> x + 1])), b |-> ([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (-1 \div 2)] \/ (SelectSeq(<<1, 2>>, LAMBDA e : e > 0) = (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<1, 2>> with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<1, 2>> with the value:
    1
---*)
