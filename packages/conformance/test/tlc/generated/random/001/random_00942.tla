(*---
description: Evaluates a random function expression, seed 262, number 942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([UNION {{b1515 \in 1..3 : TRUE}, {b1516 \in 1..3 : FALSE}} EXCEPT ![Cardinality({b1517 \in SUBSET {1} : {1, 2}})] = ((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE))[CASE FALSE -> 1 [] OTHER -> -1]] @@ ((Head(<<1>>) \div Cardinality(1..3)) :> ((0 - 7) + ([a |-> 1]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00942 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Evaluating predicate line 14, col 121 to line 14, col 126 of module random_00942 yielded non-Boolean value.
---*)
