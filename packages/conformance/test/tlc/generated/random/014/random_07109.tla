(*---
description: Evaluates a random function expression, seed 262, number 7109.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07109 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [2..1 -> {}] : TRUE) @@ ((-0) :> ([a |-> 1]).a)) EXCEPT ![(CHOOSE b10918 \in {CASE FALSE -> b10919 [] OTHER -> b10919 : b10919 \in UNION {2..1, 2..1}} : (DOMAIN <<5, 6>> \subseteq ({1, 2} \cap SUBSET {1})))] = Cardinality(DOMAIN (CHOOSE f \in [2..1 -> {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07109 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 91 to line 14, col 236 of module random_07109
---*)
