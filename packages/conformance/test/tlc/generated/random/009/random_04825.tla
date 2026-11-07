(*---
description: Evaluates a random function expression, seed 262, number 4825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([a |-> 2, b |-> TRUE]).a) :> (Cardinality(UNION {SUBSET {1}, {1}}) * (-CASE FALSE -> 1 [] OTHER -> 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    1
---*)
