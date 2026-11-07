(*---
description: Evaluates a random bool expression, seed 262, number 3388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b5380 \in {LET b5381 == (1 + 1) IN CASE FALSE -> b5381 [] OTHER -> b5381, (CHOOSE b5382 \in (2..1 \cup 1..3) : (Nat \subseteq {1}))} : ((-(b5380 % b5380)) \in SelectSeq(SubSeq(<<1>>, b5380, 7), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03388 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 132 to line 14, col 148 of module random_03388
---*)
