(*---
description: Evaluates a random bool expression, seed 262, number 7724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (<<>> = (1 :> 2)) THEN LET b11909 == 0 IN 2 ELSE (CHOOSE b11910 \in {1} : TRUE) \in (Len(<<>>) .. CASE FALSE -> -1 [] OTHER -> 0)) \/ ((CHOOSE b11911 \in UNION {2..1, {1}} : (TRUE \/ FALSE)) = (CHOOSE b11912 \in (0 .. -1) : (Nat \subseteq {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07724 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 215 to line 14, col 262 of module random_07724
---*)
