(*---
description: Evaluates a random record expression, seed 262, number 6808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))] EXCEPT !.a = IF (CASE TRUE -> (1 :> 2) [] OTHER -> 7 = LET b10439 == 2 IN 1..3) THEN (CHOOSE b10440 \in UNION {Nat, Nat} : (TRUE => FALSE)) ELSE (Cardinality({x \in 1..3 : x > 1}) + Head(Nat))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06808 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 133 to line 14, col 311 of module random_06808
---*)
