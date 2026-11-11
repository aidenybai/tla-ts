(*---
description: Evaluates a random bool expression, seed 262, number 7538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(({x \in 1..3 : x > 1} \cup SUBSET {1})) + (CHOOSE b11617 \in {0, 2} : (b11617 = b11617))) < LET b11618 == ([<<5, 6>> EXCEPT ![2147483647] = -1] * (-1 - 0)) IN (-IF TRUE THEN b11618 ELSE b11618)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07538 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    3
---*)
