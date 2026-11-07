(*---
description: Evaluates a random int expression, seed 262, number 7019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10767 \in Tail((<<3, 1, 2>> \o <<3, 1, 2>>)) : (\E b10768 \in (Nat \ Nat) : (\E b10769 \in {} : TRUE))) - Len(SubSeq(Append(<<1, 2>>, -1), IF TRUE THEN -1 ELSE -1, Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07019 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 127 of module random_07019
---*)
