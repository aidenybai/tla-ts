(*---
description: Evaluates a random bool expression, seed 262, number 3484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5504 \in SelectSeq(<<3, 0>>, LAMBDA e : e > 0) : ((CHOOSE b5505 \in SUBSET {1} : FALSE) \in (b5504 .. 7))) \in {(CHOOSE b5506 \in ({} \cap {x \in 1..3 : x > 1}) : (2..1 \subseteq 2..1)), (CHOOSE b5507 \in (Nat \cap {1, 2}) : (TRUE <=> FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03484 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 130 of module random_03484
---*)
