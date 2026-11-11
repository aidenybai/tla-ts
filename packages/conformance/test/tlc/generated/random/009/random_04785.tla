(*---
description: Evaluates a random function expression, seed 262, number 4785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b7470 \in Nat : TRUE) :> (CHOOSE b7471 \in {x \in 1..3 : x > 1} : FALSE)))[Cardinality(UNION {SUBSET {1}, 1..3})], Append(SelectSeq(SubSeq(<<1, 2>>, 3, 1), LAMBDA e : e > 0), ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) % Head(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04785 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 20 to line 14, col 46 of module random_04785
---*)
