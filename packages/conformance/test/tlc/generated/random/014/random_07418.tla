(*---
description: Evaluates a random record expression, seed 262, number 7418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[Append(<<3, 1, 2>>, 2) EXCEPT !.a = @ + IF TRUE THEN 1 ELSE 2147483647] EXCEPT !.a = IF (FALSE /\ TRUE) THEN (0)[3] ELSE ((1 :> 2))[[a |-> 1]]] EXCEPT !.a = Head(Tail([FALSE EXCEPT ![1] = 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07418 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
