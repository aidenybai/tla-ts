(*---
description: Evaluates a random function expression, seed 262, number 405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b661 == ((<<1>> + 1) + Head(<<5, 6>>)) IN (CHOOSE b662 \in (<<1>> \cap {}) : (b662 < b661)) :> ((Cardinality({1}) * CASE TRUE -> 7 [] OTHER -> 2) % CASE (\E b663 \in {1} : TRUE) -> Head(<<3, 1, 2>>) [] OTHER -> (7 \div 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00405 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 64 to line 14, col 110 of module random_00405
---*)
