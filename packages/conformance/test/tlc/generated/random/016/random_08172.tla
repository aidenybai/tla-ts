(*---
description: Evaluates a random int expression, seed 262, number 8172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(UNION {{(-2147483647) : b12639 \in UNION {{2, 1, 3}, {x \in 1..3 : x > 1}}}, ((SUBSET {1} \cap -1) \ {b12640 \in {2, 1, 3} : TRUE})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    {}
    is an element of the integer -1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check if the value:
    {}
    is an element of the integer -1
---*)
