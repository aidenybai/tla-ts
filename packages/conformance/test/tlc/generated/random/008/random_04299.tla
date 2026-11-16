(*---
description: Evaluates a random bool expression, seed 262, number 4299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) => ((Nat \cup {}) \subseteq {-1, 7})) => (({b6778 \in 2..1 : FALSE} \cap ({x \in 1..3 : x > 1} \cup 1..3)) = DOMAIN (1 :> 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04299 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 18 to line 14, col 123 of module random_04299
---*)
