(*---
description: Evaluates a random record expression, seed 262, number 2808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b4457 \in 2..1 : FALSE)] EXCEPT !.a = ((0 * 1) % ([x \in 1..2 |-> x])[[a |-> 1, b |-> TRUE]])] EXCEPT !.a = (Len(SortSeq(<<>>, LAMBDA p, q : p < q)) % (CHOOSE b4458 \in DOMAIN <<5, 6>> : (\A b4459 \in [a |-> 1] : <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02808 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 78 to line 14, col 106 of module random_02808
---*)
