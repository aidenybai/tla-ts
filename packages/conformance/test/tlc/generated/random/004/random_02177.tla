(*---
description: Evaluates a random bool expression, seed 262, number 2177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<1>>, 2147483647, 7) = (<<5, 6>> @@ (1 :> 2))) => [[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = (3 % 1)]) /\ (((2..1 /\ FALSE) /\ (\A b3433 \in 2..1 : FALSE)) <=> ((\A b3434 \in Nat : TRUE) => (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02177 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form i..j.
    line 14, col 138 to line 14, col 150 of module random_02177
---*)
