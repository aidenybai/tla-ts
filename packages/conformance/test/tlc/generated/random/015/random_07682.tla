(*---
description: Evaluates a random set expression, seed 262, number 7682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b11827 \in ({1} \cup SUBSET {1}) : (<<3, 1, 2>> = [x \in 1..2 |-> x])} \cap {(CHOOSE b11829 \in 1..3 : FALSE) : b11828 \in {b11830 \in {x \in 1..3 : x > 1} : TRUE}}), (UNION {UNION {{1, 2}, Nat}, ({} \ Nat)} \ [(<<1>> \o <<>>) EXCEPT ![1] = (2 \div 2147483647)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07682 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 103 to line 14, col 132 of module random_07682
---*)
