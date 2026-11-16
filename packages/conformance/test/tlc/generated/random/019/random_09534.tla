(*---
description: Evaluates a random set expression, seed 262, number 9534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE (UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} = {3, 1}) -> ([a |-> 7, b |-> FALSE]).a [] OTHER -> Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), CASE (IF FALSE THEN 0 ELSE 3 = (CHOOSE b14817 \in {} : FALSE)) -> ((CHOOSE r \in [a : 2..1] : TRUE)).a [] OTHER -> [a |-> (-3), b |-> (2 < 7)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09534 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 195 to line 14, col 222 of module random_09534
---*)
