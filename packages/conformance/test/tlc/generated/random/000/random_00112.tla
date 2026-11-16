(*---
description: Evaluates a random function expression, seed 262, number 112.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00112 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b168 \in ((([a |-> 1, b |-> TRUE]).a \cup (SUBSET {1} \ {x \in 1..3 : x > 1})) \ ({b169 \in {x \in 1..3 : x > 1} : 1..3} \ UNION {Nat, {1}})) |-> ((-(CHOOSE b170 \in 1..3 : FALSE)) \div Len(SubSeq(<<1, 2>>, 3, 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00112 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form i..j.
    line 14, col 132 to line 14, col 135 of module random_00112
---*)
