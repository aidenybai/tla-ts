(*---
description: Evaluates a random bool expression, seed 262, number 7244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cap {-1, 3}) \cap UNION {(Nat \cup {x \in 1..3 : x > 1}), (2147483647 .. 7)}) \subseteq {b11141 \in {LET b11142 == 0 IN 2147483647, Cardinality({2, 1, 3})} : (<<2147483647, b11141>> = (CHOOSE f \in [{1, 2} -> 2..1] : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07244 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 221 to line 14, col 256 of module random_07244
---*)
