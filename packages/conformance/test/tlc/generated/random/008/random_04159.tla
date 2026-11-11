(*---
description: Evaluates a random seq expression, seed 262, number 4159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((CHOOSE b6547 \in Nat : TRUE) :> (-3)))[Head(<<2, -1>>)], [(CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) EXCEPT ![({-1 : b6548 \in {}} - (3 % 1))] = Len(SubSeq(<<1>>, 7, 3))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04159 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 21 to line 14, col 47 of module random_04159
---*)
