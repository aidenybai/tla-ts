(*---
description: Evaluates a random seq expression, seed 262, number 5428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (3 \div 1), Head(<<1>>)) EXCEPT ![1] = CASE (FALSE \/ TRUE) -> SubSeq(<<1, 2>>, 2, 3) [] OTHER -> IF FALSE THEN 1 ELSE [x \in 1..2 |-> x]], Len(<<CASE FALSE -> 3 [] OTHER -> 3, (CHOOSE b8407 \in SUBSET {1} : TRUE)>>), Head(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (3 * 7), (CHOOSE b8408 \in {1, 2} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 91 of module random_05428
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05428 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 344 to line 14, col 374 of module random_05428
---*)
