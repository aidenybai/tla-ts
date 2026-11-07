(*---
description: Evaluates a random function expression, seed 262, number 9000.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09000 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Head(<<3, 1, 2>>) - Len(<<1>>)) :> (Head(<<1, 2>>) % (2147483647 % 3))) @@ [b13980 \in {b13981 \in (SUBSET {1} \ {1, 2}) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} |-> Cardinality((1..3 \cup {1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
