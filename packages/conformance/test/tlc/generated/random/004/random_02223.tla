(*---
description: Evaluates a random int expression, seed 262, number 2223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (SelectSeq(<<>>, LAMBDA e : e > 0) = (0 :> -1)) -> IF (TRUE <=> TRUE) THEN LET b3498 == -1 IN 7 ELSE ([a |-> 1]).a [] OTHER -> ((7 - 3) + (0 + 2147483647)) \div Cardinality(DOMAIN ((1 :> 2) @@ (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02223 failed.
    2178:0 Overflow when computing 4+2147483647
---*)
