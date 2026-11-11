(*---
description: Evaluates a random set expression, seed 262, number 1906.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01906 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (Len(<<>>) < (\E b2992 \in {1, 2} : TRUE)) -> (LET b2993 == 2147483647 IN 3 * (2 - -1)) [] OTHER -> ((-1 % TRUE) :> Cardinality(SUBSET {1})) .. ((CASE TRUE -> 2147483647 [] OTHER -> 1 * IF TRUE THEN 7 ELSE 2) * (((1 :> 2) @@ [x \in 1..2 |-> x]))[LET b2994 == 7 IN 2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01906 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    TRUE
---*)
