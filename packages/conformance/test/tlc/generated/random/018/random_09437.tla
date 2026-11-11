(*---
description: Evaluates a random bool expression, seed 262, number 9437.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09437 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14648 \in SelectSeq(Tail(<<1>>), LAMBDA e : e > 0) : (Len(<<>>) = (b14648 \div 7))) = Len(LET b14649 == (2 \div 3) IN CASE TRUE -> 3 [] OTHER -> -1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09437 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 107 of module random_09437
---*)
