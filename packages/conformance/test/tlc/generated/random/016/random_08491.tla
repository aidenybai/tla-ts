(*---
description: Evaluates a random record expression, seed 262, number 8491.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08491 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + IF [x \in 1..2 |-> x] THEN 7 ELSE 3] EXCEPT !.a = @ + IF (TRUE <=> FALSE) THEN ((1 :> 2))[1] ELSE IF FALSE THEN 0 ELSE 1] EXCEPT !.a = @ + (-(-Append(<<3, 1, 2>>, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08491 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 74 to line 14, col 108 of module random_08491
---*)
