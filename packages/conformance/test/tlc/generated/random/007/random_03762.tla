(*---
description: Evaluates a random int expression, seed 262, number 3762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b5930 \in DOMAIN (1 :> 2) : (FALSE \/ FALSE)) - Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) \div LET b5931 == Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), [<<>> EXCEPT ![1] = 2147483647]) IN LET b5932 == CASE FALSE -> b5931 [] OTHER -> [a |-> 1, b |-> TRUE] IN Head(<<1, 2>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03762 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 69 of module random_03762
---*)
