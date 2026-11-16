(*---
description: Evaluates a random set expression, seed 262, number 7771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (<<1>> = [x \in Nat |-> x + 1]) THEN Head(<<>>) ELSE (-1 - 7), CASE (\A b11987 \in [x \in Nat |-> x + 1] : FALSE) -> LET b11988 == 0 IN b11988 [] OTHER -> Len(<<>>)} \cup {b11989 \in (DOMAIN [x \in 1..2 |-> x] \cup ({1} \ 1..3)) : ((-b11989) = (TRUE).a)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07771 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
