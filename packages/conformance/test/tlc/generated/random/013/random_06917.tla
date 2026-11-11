(*---
description: Evaluates a random bool expression, seed 262, number 6917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + (CHOOSE b10587 \in 1..3 : TRUE)] => (UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} \subseteq DOMAIN (1 :> 2))) \/ ((Tail(<<1>>) = (7 :> 7)) /\ (({x \in 1..3 : x > 1} \ {1}) \subseteq (3 :> 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06917 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a record.
    line 14, col 18 to line 14, col 182 of module random_06917
---*)
