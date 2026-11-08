(*---
description: Evaluates a random int expression, seed 262, number 4699.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04699 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (Cardinality((1 \ {1})) \in ((1 \div 7) .. Cardinality({x \in 1..3 : x > 1}))) THEN (((CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))[LET b7347 == -1 IN 3] - Cardinality(UNION {1..3, {1, 2}})) ELSE ((-LET b7348 == 2147483647 IN -1) \div ((0 - 2) \div (7 - -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04699 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    1
    is not enumerable.
---*)
