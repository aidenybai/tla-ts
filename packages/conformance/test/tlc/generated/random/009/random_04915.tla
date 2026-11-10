(*---
description: Evaluates a random record expression, seed 262, number 4915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((Nat \cap {2, 1, 3}) \cup {b7647 \in {x \in 1..3 : x > 1} : TRUE}), ({-1, 3} \cup (CHOOSE r \in [a : {0} \cup {1}] : TRUE))} = {b7648 \in {(-b7649) : b7649 \in (-1 .. 0)} : (((1 :> 2) @@ [x \in 1..2 |-> x]) \/ (b7648 \in {}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04915 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 199 to line 14, col 248 of module random_04915
---*)
