(*---
description: Evaluates a random function expression, seed 262, number 4128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b6487 \in LET b6488 == (CHOOSE b6489 \in {2, 1, 3} : TRUE) IN IF FALSE THEN 2 ELSE -1 |-> IF Head(<<1, 2>>) THEN LET b6490 == TRUE IN b6487 ELSE (<<5, 6>>)[b6487]] @@ [[b6491 \in (SUBSET {1} \cap {}) |-> (b6491 @@ [x \in 1..2 |-> x])] EXCEPT ![(CHOOSE b6492 \in (2 .. 7) : (TRUE \/ TRUE))] = LET b6493 == (1 * 3) IN (-2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 186 to line 14, col 251 of module random_04128
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04128 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer -1.
---*)
