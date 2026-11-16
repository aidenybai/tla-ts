(*---
description: Evaluates a random function expression, seed 262, number 4486.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04486 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([b7050 \in {b7051 \in {1, 2} : FALSE} |-> CASE FALSE -> 3 [] OTHER -> b7050]) :> (((CHOOSE r \in [a : {}] : TRUE)).a \div Head(<<[x \in Nat |-> x + 1], 7>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04486 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 105 to line 14, col 132 of module random_04486
---*)
