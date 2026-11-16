(*---
description: Evaluates a random bool expression, seed 262, number 6618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq([(<<1>> \o <<1>>) EXCEPT ![1] = (CHOOSE b10158 \in {1} : TRUE)], LAMBDA e : e > 0) = ((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06618 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 162 to line 14, col 204 of module random_06618
---*)
