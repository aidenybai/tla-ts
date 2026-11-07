(*---
description: Evaluates a random set expression, seed 262, number 7629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-(CASE TRUE -> 2 [] OTHER -> b11735 + (1 * b11735))) : b11735 \in {((CHOOSE r \in [a : {}] : TRUE)).a : b11736 \in (Cardinality({}) .. Len(<<3, 1, 2>>))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07629 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 87 to line 14, col 114 of module random_07629
---*)
