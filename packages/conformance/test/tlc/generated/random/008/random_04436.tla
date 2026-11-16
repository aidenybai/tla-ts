(*---
description: Evaluates a random bool expression, seed 262, number 4436.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04436 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b6982 \in (CASE TRUE -> 7 [] OTHER -> 2 .. (0 + 3)) : (\A b6983 \in [a |-> 3, b |-> TRUE] : ({} = {1}))) < Len(SubSeq([<<1, 2>> EXCEPT ![1] = 2], (-2147483647), (-0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04436 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 127 of module random_04436
---*)
