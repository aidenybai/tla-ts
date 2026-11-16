(*---
description: Evaluates a random bool expression, seed 262, number 8467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([a |-> -1, b |-> (1 :> 2)]).a) = (IF (TRUE <=> FALSE) THEN ([a |-> 1, b |-> TRUE]).a ELSE Len(<<>>) \div ((0 - 1) \div (CHOOSE b13100 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08467 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 140 to line 14, col 175 of module random_08467
---*)
