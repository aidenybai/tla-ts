(*---
description: Evaluates a random function expression, seed 262, number 8009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((FALSE <=> TRUE) /\ ({} \subseteq Nat)) -> ([a |-> 7, b |-> <<5, 6>>]).a [] OTHER -> Cardinality((-1 .. -1)) :> ((CHOOSE b12362 \in ({1} \ {x \in 1..3 : x > 1}) : ({1, 2} = {1})) - ((-2) * ([a |-> 1] \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08009 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 137 to line 14, col 199 of module random_08009
---*)
