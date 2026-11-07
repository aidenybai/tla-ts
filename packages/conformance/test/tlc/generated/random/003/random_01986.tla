(*---
description: Evaluates a random int expression, seed 262, number 1986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE {LET b3146 == (-1) IN {-1, 3}, LET b3147 == (3 \div 7) IN (CHOOSE b3148 \in 2..1 : FALSE)} -> IF (~(FALSE <=> FALSE)) THEN (CASE FALSE -> 2147483647 [] OTHER -> FALSE - CASE FALSE -> 2 [] OTHER -> 3) ELSE (-Head(<<1, 2>>)) [] OTHER -> (CHOOSE b3149 \in [a |-> ((1 :> 2))[1], b |-> (FALSE <=> FALSE)] : (\A b3150 \in ({1} \cap {x \in 1..3 : x > 1}) : (<<>> = (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01986 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 80 to line 14, col 108 of module random_01986
---*)
