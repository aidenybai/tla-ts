(*---
description: Evaluates a random int expression, seed 262, number 1719.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01719 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {({} \cap {2, 1, 3}), (2..1 \ SUBSET {1})}) \div (Cardinality({[x \in Nat |-> x + 1], 2}) \div (-(2 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01719 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    [x \in Nat |-> <expression line 14, col 113 to line 14, col 117 of module random_01719>]
---*)
