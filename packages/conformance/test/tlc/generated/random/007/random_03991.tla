(*---
description: Evaluates a random function expression, seed 262, number 3991.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03991 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {UNION {SUBSET {1}, Nat}, [a |-> 3, b |-> TRUE]}) :> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03991 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {{}, {1}}
---*)
