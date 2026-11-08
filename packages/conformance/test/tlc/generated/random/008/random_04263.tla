(*---
description: Evaluates a random function expression, seed 262, number 4263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((1 + -1) - (2 * 2)) :> (Head(3) \div Append(<<3, 1, 2>>, 0))) EXCEPT ![(([(1 :> 2) EXCEPT !.a = @ + -1]).a - (CHOOSE b6709 \in SortSeq(<<1>>, LAMBDA p, q : p < q) : (\E b6710 \in 2..1 : TRUE)))] = ((\A b6711 \in UNION {{2, 1, 3}, 1..3} : (<<1, 2>> \subseteq SUBSET {1})) - Cardinality(UNION {Nat, {1, 2}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04263 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    3
---*)
