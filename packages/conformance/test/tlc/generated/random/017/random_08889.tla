(*---
description: Evaluates a random bool expression, seed 262, number 8889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = [b13772 \in (3 .. 3) |-> (b13772 % b13772)]] = ((Len(<<>>) * CASE TRUE -> 2 [] OTHER -> -1) < Cardinality(UNION {{1, 2}, SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08889 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_08889
---*)
