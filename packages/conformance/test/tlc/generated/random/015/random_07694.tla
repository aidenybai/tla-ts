(*---
description: Evaluates a random bool expression, seed 262, number 7694.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07694 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + Len(<<>>)]) <=> (UNION {{{2, 1, 3}, 7}, ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])} < (CHOOSE b11850 \in {2147483647 : b11851 \in SUBSET {1}} : (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07694 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 214 to line 14, col 286 of module random_07694
---*)
