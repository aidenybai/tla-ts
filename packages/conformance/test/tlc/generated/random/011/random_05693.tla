(*---
description: Evaluates a random set expression, seed 262, number 5693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((LET b8770 == 2147483647 IN 2 .. ([a |-> 1, b |-> TRUE]).a) \subseteq ((3 .. -1) \ (Nat \cup {2, 1, 3}))), ((CHOOSE r \in [a : {}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05693 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 127 to line 14, col 154 of module random_05693
---*)
