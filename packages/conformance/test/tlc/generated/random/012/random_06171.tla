(*---
description: Evaluates a random record expression, seed 262, number 6171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (CHOOSE b9489 \in <<1>> : TRUE)] EXCEPT !.a = @ + ([(1 :> 2) EXCEPT !.a = @ + 1]).a] EXCEPT !.a = Head(SelectSeq((<<1, 2>> \o <<1, 2>>), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06171 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 74 to line 14, col 102 of module random_06171
---*)
