(*---
description: Evaluates a random set expression, seed 262, number 8385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Cardinality((2 .. 2)) \div [[[a |-> 1, b |-> TRUE] EXCEPT !.a = [a |-> 1]] EXCEPT !.a = @ + (1 % -1)]) : b12972 \in ([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = LET b12973 == 3 IN b12973] \ ({b12974 \in {x \in 1..3 : x > 1} : <<1>>} \ {b12975 \in {x \in 1..3 : x > 1} : FALSE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08385 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a tuple.
    line 14, col 250 to line 14, col 254 of module random_08385
---*)
