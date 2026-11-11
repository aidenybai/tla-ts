(*---
description: Evaluates a random bool expression, seed 262, number 8789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b13622 \in {b13623 : b13623 \in 2..1} : (b13622 < b13622)) \in ((7 .. 7) \cup {7, 1})) <=> (Head(Append(<<1, 2>>, 1)) \in ({0, 0} \ UNION {Nat, {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08789 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 82 of module random_08789
---*)
