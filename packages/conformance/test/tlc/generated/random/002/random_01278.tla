(*---
description: Evaluates a random int expression, seed 262, number 1278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((([x \in Nat |-> x + 1] @@ (1 :> 2)))[(2147483647 - 2)] < (Cardinality(1..3) \div (7 + 0))) THEN [b2035 \in ((SUBSET {1} \cup {1}) \ {0, 1}) |-> Len(Append(<<>>, 3))] ELSE Head(SortSeq(SubSeq(<<3, 1, 2>>, 0, -1), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
