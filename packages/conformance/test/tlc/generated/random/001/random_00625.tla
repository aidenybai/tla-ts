(*---
description: Evaluates a random record expression, seed 262, number 625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q) % ((2 :> 2) /\ (7 < 7))) :> IF SubSeq(<<-1, 3>>, CASE TRUE -> 0 [] OTHER -> 7, (3 % 2)) THEN (CHOOSE b1047 \in UNION {{1}, {}} : (b1047 < -1)) ELSE LET b1048 == CASE TRUE -> 1 [] OTHER -> 0 IN Cardinality(SUBSET {1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00625 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 66 to line 14, col 84 of module random_00625
---*)
