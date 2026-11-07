(*---
description: Evaluates a random seq expression, seed 262, number 2820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SubSeq([<<>> EXCEPT ![1] = 2], (CHOOSE b4482 \in Nat : TRUE), (3 \div 0)), LAMBDA p, q : p < q), CASE (([a |-> 1] .. 3) /\ (<<1, 2>> = <<5, 6>>)) -> Head((<<>> \o <<>>)) [] OTHER -> Head(SubSeq(<<1>>, 0, 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 42 of module random_02820
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02820 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 63 to line 14, col 89 of module random_02820
---*)
