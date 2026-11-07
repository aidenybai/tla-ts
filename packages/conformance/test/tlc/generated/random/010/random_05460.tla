(*---
description: Evaluates a random bool expression, seed 262, number 5460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \cap UNION {1..3, {1, 2}}), DOMAIN ((1 :> 2) @@ [a |-> 1])} = {((b8451 - 1) + (b8451 - 0)) : b8451 \in (UNION {{1, 2}, {x \in 1..3 : x > 1}} \cap UNION {{1, 2}, {}})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
---*)
