(*---
description: Evaluates a random seq expression, seed 262, number 3941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(-(2 * 1)), CASE [b6203 \in {2, 1, 3} |-> b6203] -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> IF TRUE THEN 3 ELSE 3>> \o (CHOOSE r \in [a : {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03941 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 36 to line 14, col 66 of module random_03941
---*)
