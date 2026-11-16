(*---
description: Evaluates a random function expression, seed 262, number 8037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> 2..1] : TRUE) @@ [b12403 \in {b12404 \in (CHOOSE r \in [a : {2, 1, 3}] : TRUE) : (\E b12405 \in SUBSET {1} : FALSE)} |-> Len(SubSeq(<<>>, b12403, 2))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08037 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 53 of module random_08037
---*)
