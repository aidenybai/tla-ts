(*---
description: Evaluates a random set expression, seed 262, number 7040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) @@ [[x \in Nat |-> x + 1] EXCEPT ![0] = 3]) \cup ((Len(<<1, 2>>) \div (CHOOSE r \in [a : 1..2] : TRUE)) .. Head(SubSeq(<<1>>, 2, -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07040 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
