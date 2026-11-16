(*---
description: Evaluates a random int expression, seed 262, number 1667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((FALSE <=> TRUE) /\ (FALSE <=> <<1, 2>>)) -> Len(SubSeq(<<1, 2>>, 3, 7)) [] OTHER -> (CASE FALSE -> -1 [] OTHER -> -1 - LET b2659 == 2 IN b2659) * (CHOOSE b2660 \in UNION {{b2661 \in {1, 2} : FALSE}, {b2662 \in {1, 2} : FALSE}} : ((CHOOSE r \in [a : {1, 2}] : TRUE) \subseteq DOMAIN (1 :> 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01667 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 171 to line 14, col 314 of module random_01667
---*)
