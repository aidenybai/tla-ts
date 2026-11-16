(*---
description: Evaluates a random set expression, seed 262, number 6770.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06770 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10379 \in DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) : ([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = SelectSeq(<<1, 2>>, LAMBDA e : e > 0)] = [b10380 \in {b10381 \in {x \in 1..3 : x > 1} : b10381} |-> Head(<<3, 1, 2>>)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06770 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 226 to line 14, col 231 of module random_06770
---*)
