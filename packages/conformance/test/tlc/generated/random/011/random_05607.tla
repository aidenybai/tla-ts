(*---
description: Evaluates a random seq expression, seed 262, number 5607.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05607 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SelectSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA e : e > 0), (CHOOSE b8681 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE <=> TRUE))) EXCEPT ![1] = (-(-Len(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05607 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 90 to line 14, col 152 of module random_05607
---*)
