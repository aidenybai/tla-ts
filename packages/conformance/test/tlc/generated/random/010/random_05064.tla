(*---
description: Evaluates a random set expression, seed 262, number 5064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b7880 \in SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q) : (DOMAIN 0 = (1 .. b7880))), ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05064 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 109 of module random_05064
---*)
