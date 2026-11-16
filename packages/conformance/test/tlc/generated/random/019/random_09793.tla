(*---
description: Evaluates a random bool expression, seed 262, number 9793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (FALSE => FALSE) -> LET b15196 == 1 IN 7 [] OTHER -> Head(<<>>) + ([[a |-> 1] EXCEPT !.a = @ + 1]).a) = (-(CHOOSE b15197 \in ({x \in 1..3 : x > 1} \ 2..1) : ({x \in 1..3 : x > 1} \subseteq <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09793 failed.
    Attempted to check set membership in a tuple value.
---*)
