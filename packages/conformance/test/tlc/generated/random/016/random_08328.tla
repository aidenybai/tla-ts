(*---
description: Evaluates a random int expression, seed 262, number 8328.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08328 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) @@ [b12880 \in SUBSET {1} |-> 2]) @@ [[b12881 \in {1, 2} |-> 7] EXCEPT ![IF TRUE THEN 7 ELSE -1] = (2147483647 \div 2)]))[Cardinality(({7 : b12882 \in {x \in 1..3 : x > 1}} \cup {2147483647, 2147483647}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
---*)
