(*---
description: Evaluates a random set expression, seed 262, number 8420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (~(\A b13033 \in {2, 1, 3} : TRUE)) THEN (CHOOSE b13034 \in {0, 3} : (\E b13035 \in 1..3 : TRUE)) ELSE Cardinality({2, -1}), Cardinality(UNION {(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE), DOMAIN [x \in 1..2 |-> x]})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2} with the value:
    [a |-> 2]
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1, 2} with the value:
    [a |-> 2]
---*)
