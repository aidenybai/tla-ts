(*---
description: Evaluates a random record expression, seed 262, number 8006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [b12357 \in UNION {(2 .. 7), DOMAIN <<1, 2>>} |-> LET b12358 == Head([a |-> 1, b |-> TRUE]) IN (b12357 \div 1)], b |-> (Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) \/ (Head(<<3, 1, 2>>) \in (FALSE /\ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08006 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    an integer.
    line 14, col 143 to line 14, col 228 of module random_08006
---*)
