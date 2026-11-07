(*---
description: Evaluates a random int expression, seed 262, number 8138.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08138 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b12574 == (CHOOSE b12575 \in (<<1, 2>> \o Tail(<<1, 2>>)) : ({b12575, 0} = ({1, 2} \ {}))) IN [(LET b12576 == 0 IN 0 :> (FALSE % b12574)) EXCEPT ![([a |-> b12574, b |-> FALSE]).a] = Cardinality(({1} = 2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08138 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 31 to line 14, col 108 of module random_08138
---*)
