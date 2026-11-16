(*---
description: Evaluates a random bool expression, seed 262, number 3659.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03659 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(<<2, 3>>) = ((CHOOSE b5784 \in 1..3 : FALSE) :> CASE TRUE -> 2147483647 [] OTHER -> [x \in 1..2 |-> x])) <=> (Len(<<2147483647, 2147483647>>) = Cardinality(DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03659 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 37 to line 14, col 65 of module random_03659
---*)
