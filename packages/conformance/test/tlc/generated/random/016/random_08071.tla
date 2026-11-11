(*---
description: Evaluates a random seq expression, seed 262, number 8071.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08071 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([(LET b12471 == 0 IN 1 :> (3 * 3)) EXCEPT ![LET b12472 == (2 \div 7) IN Cardinality({1})] = ((CHOOSE b12473 \in 2..1 : FALSE) * IF FALSE THEN 2147483647 ELSE 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08071 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 115 to line 14, col 144 of module random_08071
---*)
