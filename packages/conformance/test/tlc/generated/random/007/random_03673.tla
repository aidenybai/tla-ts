(*---
description: Evaluates a random int expression, seed 262, number 3673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({2, 1, 3} = {1, 2}) -> ([x \in Nat |-> x + 1]).a [] OTHER -> Len(<<>>) + ((CHOOSE r \in [a : 2..1] : TRUE)).a) \div (CHOOSE b5804 \in UNION {{b5805 : b5805 \in 1..3}, {b5806 \in {2, 1, 3} : TRUE}} : ((TRUE => TRUE) => (TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03673 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 99 to line 14, col 128 of module random_03673
---*)
