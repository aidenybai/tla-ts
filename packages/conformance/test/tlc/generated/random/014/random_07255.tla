(*---
description: Evaluates a random function expression, seed 262, number 7255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1} -> 1..2] : TRUE) @@ [(CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) EXCEPT ![(-1 * 1)] = (7 + 2)]) @@ [b11163 \in ((CHOOSE r \in [a : 1..2] : TRUE) \cup (SUBSET {1} \cup {1})) |-> (((1 :> 2))[0] \div Cardinality(2..1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 59 to line 14, col 108 of module random_07255
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07255 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    [a |-> 1]
    and T:
    {1} \cup {{}, {1}}
    are not both enumerable
---*)
