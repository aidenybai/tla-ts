(*---
description: Evaluates a random function expression, seed 262, number 48.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((-(CHOOSE b68 \in {1, 2} : FALSE)) :> ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[([x \in 1..2 |-> x])[2]]) EXCEPT ![IF (\E b69 \in (SUBSET {1} \cap 2..1) : (FALSE /\ FALSE)) THEN Head((<<1>> \o <<1, 2>>)) ELSE Len(SortSeq(<<>>, LAMBDA p, q : p < q))] = LET b70 == Len(<<0, 2147483647>>) IN ((CHOOSE r \in [a : {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00048 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 49 of module random_00048
---*)
