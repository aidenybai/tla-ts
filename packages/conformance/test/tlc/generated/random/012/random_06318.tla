(*---
description: Evaluates a random bool expression, seed 262, number 6318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Append(<<2, 2147483647>>, (CHOOSE b9709 \in 2..1 : FALSE)), CASE ([a |-> 1] = [a |-> 1]) -> CASE TRUE -> 1 [] OTHER -> 3 [] OTHER -> (<<5, 6>>)[2147483647]) = [b9710 \in {b9711 \in [b9712 \in 2..1 |-> [a |-> 1]] : ([a |-> 1] = [a |-> 1, b |-> TRUE])} |-> SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (b9710 - b9710), ([a |-> 1]).a)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06318 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 51 to line 14, col 79 of module random_06318
---*)
