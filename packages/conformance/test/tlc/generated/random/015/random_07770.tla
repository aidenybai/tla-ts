(*---
description: Evaluates a random int expression, seed 262, number 7770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {DOMAIN (1 :> 2), ({x \in 1..3 : x > 1} \cap {1, 2})}) \div ((\E b11986 \in (2147483647 .. 7) : (FALSE => TRUE)) % ((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))[Cardinality({x \in 1..3 : x > 1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07770 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 152 to line 14, col 193 of module random_07770
---*)
