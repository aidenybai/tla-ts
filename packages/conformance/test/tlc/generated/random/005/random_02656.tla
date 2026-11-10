(*---
description: Evaluates a random seq expression, seed 262, number 2656.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02656 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq([[a |-> 1, b |-> {1, 2}] EXCEPT !.a = @ + ([x \in Nat |-> x + 1] @@ <<5, 6>>)], LAMBDA p, q : p < q), IF (\A b4192 \in {7, 0} : (FALSE => TRUE)) THEN Head(Append(<<>>, -1)) ELSE ((1 * 2147483647) % (-1)), (((CHOOSE f \in [{0} \cup {1} -> 1..2] : TRUE) @@ (1 :> 1)))[Cardinality(({} \cap 1..3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02656 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
