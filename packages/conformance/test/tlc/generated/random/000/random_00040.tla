(*---
description: Evaluates a random bool expression, seed 262, number 40.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {({3 : b59 \in {x \in 1..3 : x > 1}} \cap (2..1 \cap 2)), DOMAIN (CHOOSE f \in [1..2 -> {1, 2}] : TRUE)} \/ ((({} \cap SUBSET {1}) = {b60 : b60 \in {1, 2}}) <=> ([[a |-> 1] EXCEPT !.a = 2] = (CHOOSE r \in [a : {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00040 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a set of the form UNION  S.
    line 14, col 17 to line 14, col 249 of module random_00040
---*)
