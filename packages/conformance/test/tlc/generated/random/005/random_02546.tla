(*---
description: Evaluates a random bool expression, seed 262, number 2546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b4017 \in DOMAIN (CHOOSE f \in [1..2 -> {}] : TRUE) : (\A b4018 \in ((b4017 .. <<5, 6>>) \ ({1} \ Nat)) : (Head(<<3, 1, 2>>) \in {0 : b4019 \in Nat}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02546 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 38 to line 14, col 69 of module random_02546
---*)
