(*---
description: Evaluates a random seq expression, seed 262, number 2087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) + (IF TRUE THEN 1 ELSE 7 + IF [a |-> 1] THEN 2 ELSE 7)), (CHOOSE b3323 \in ({2147483647, 2147483647} \cap {3 : b3324 \in {x \in 1..3 : x > 1}}) : (IF <<1, 2>> THEN 1 ELSE b3323 = (b3323 % 3)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02087 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 122 to line 14, col 254 of module random_02087
---*)
