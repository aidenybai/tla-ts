(*---
description: Evaluates a random int expression, seed 262, number 1945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b3064 \in {b3065 \in {b3066 \in {x \in 1..3 : x > 1} : FALSE} : ({1, 2} \subseteq TRUE)} : (Head(<<1>>) \in UNION {SUBSET {1}, 1..3})) % IF ((<<1>> \o 2) = (CHOOSE f \in [1..2 -> 2..1] : TRUE)) THEN ((CHOOSE b3067 \in 1..3 : TRUE) - (1..3).a) ELSE Cardinality({b3068 \in {} : TRUE})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01945 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 157 of module random_01945
---*)
