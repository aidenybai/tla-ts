(*---
description: Evaluates a random seq expression, seed 262, number 2776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(UNION {(CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE), (2 .. 2)}), ([b4385 \in {7, 7} |-> IF TRUE THEN b4385 ELSE b4385])[(IF FALSE THEN 7 ELSE 3 * CASE FALSE -> 1 [] OTHER -> 2)]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02776 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {2} with the value:
    (2 :> 1)
---*)
