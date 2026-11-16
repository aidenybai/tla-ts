(*---
description: Evaluates a random function expression, seed 262, number 8063.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08063 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([(<<5, 6>> @@ (1 :> 2)) EXCEPT ![(CHOOSE b12457 \in {x \in 1..3 : x > 1} : FALSE)] = ([a |-> 1, b |-> TRUE]).a] @@ ((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE) @@ [b12458 \in SUBSET {1} |-> b12458])) EXCEPT ![Len(SortSeq([<<>> EXCEPT ![1] = TRUE], LAMBDA p, q : p < q))] = LET b12459 == ((-1 - 7) + (3 \div 0)) IN ({b12459, 1} \ (2..1 \ 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08063 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 52 to line 14, col 97 of module random_08063
---*)
