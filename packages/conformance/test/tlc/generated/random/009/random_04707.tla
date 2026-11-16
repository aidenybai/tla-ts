(*---
description: Evaluates a random record expression, seed 262, number 4707.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04707 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{((CHOOSE b7363 \in SUBSET {1} : FALSE) * (CHOOSE b7364 \in 1..3 : TRUE)), ((0 - 1) \div Len(<<>>))}, ({(1 % -1) : b7365 \in (1 .. 2147483647)} \ {b7366 \in {2147483647, 1} : (b7366 \in Nat)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04707 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 60 of module random_04707
---*)
