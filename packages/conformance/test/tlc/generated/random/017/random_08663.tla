(*---
description: Evaluates a random seq expression, seed 262, number 8663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SortSeq(<<2147483647, 2>>, LAMBDA p, q : p < q) \o [(CHOOSE b13408 \in 2..1 : FALSE) EXCEPT ![1] = Len(<<1, 2>>)]), CASE (LET b13409 == 2 IN b13409 \in DOMAIN [x \in 1..2 |-> x]) -> Len(SubSeq(<<1>>, 2147483647, 0)) [] OTHER -> IF (TRUE \/ TRUE) THEN ([a |-> 1, b |-> TRUE]).a ELSE Head(<<1, 2>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08663 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 106 of module random_08663
---*)
