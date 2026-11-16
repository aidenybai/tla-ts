(*---
description: Evaluates a random set expression, seed 262, number 1938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((CHOOSE f \in [{1} -> {1, 2}] : TRUE) @@ (1 :> 3)) \cup {b3046 \in UNION {(1..3 \cup {1, 2}), {b3047 \in {x \in 1..3 : x > 1} : FALSE}} : ((CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) \/ (Nat \subseteq 1..3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01938 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 164 to line 14, col 242 of module random_01938
---*)
