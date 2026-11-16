(*---
description: Evaluates a random set expression, seed 262, number 7003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq((<<3, 1, 2>> \o <<1>>), LAMBDA e : e > 0) .. ((CHOOSE b10733 \in 1..3 : FALSE) * CASE FALSE -> -1 [] OTHER -> 2)) \ DOMAIN (Cardinality({1}) :> (CHOOSE b10734 \in {x \in 1..3 : x > 1} : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07003 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 75 to line 14, col 104 of module random_07003
---*)
