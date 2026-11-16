(*---
description: Evaluates a random bool expression, seed 262, number 6147.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06147 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(b9449 * 0) : b9449 \in (-1 .. 0)}, ((CHOOSE b9450 \in {} : FALSE) .. SubSeq(<<3, 1, 2>>, 0, 3))} \subseteq {b9451 \in {(-1..3) : b9452 \in {b9453 \in {} : TRUE}} : [b9454 \in (1..3 \ Nat) |-> (b9451 + 1)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06147 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 63 to line 14, col 89 of module random_06147
---*)
