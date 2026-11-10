(*---
description: Evaluates a random record expression, seed 262, number 8033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([[a |-> 2, b |-> FALSE] EXCEPT !.a = @ + (CHOOSE b12395 \in TRUE : FALSE)]).a, b |-> (\A b12396 \in ({b12397 \in {1} : FALSE} \ UNION {SUBSET {1}, {2, 1, 3}}) : (LET b12398 == b12396 IN b12398 \in [<<5, 6>> EXCEPT !.a = -1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08033 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 66 to line 14, col 95 of module random_08033
---*)
