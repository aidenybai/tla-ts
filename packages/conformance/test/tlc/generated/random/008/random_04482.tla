(*---
description: Evaluates a random int expression, seed 262, number 4482.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04482 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7045 \in DOMAIN [x \in 1..2 |-> x] : (FALSE \/ TRUE)) % (IF TRUE THEN 3 ELSE 0 * CASE FALSE -> 2147483647 [] OTHER -> -1)) * (CHOOSE b7046 \in {b7047 \in (0 .. 7) : SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)} : ({3 : b7048 \in 2..1} = (Nat \cap {})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04482 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 192 to line 14, col 231 of module random_04482
---*)
