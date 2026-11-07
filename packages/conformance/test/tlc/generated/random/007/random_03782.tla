(*---
description: Evaluates a random record expression, seed 262, number 3782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Len(<<>>) + Head(<<1, 2>>)), b |-> (({x \in 1..3 : x > 1} = {1}) /\ (-1 .. 7))] EXCEPT !.a = CASE ((CHOOSE b5968 \in SUBSET {1} : FALSE) = (2147483647 - 2147483647)) -> (Head(<<>>) + (CHOOSE b5969 \in <<1>> : TRUE)) [] OTHER -> LET b5970 == Cardinality(Nat) IN LET b5971 == -1 IN {}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03782 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 125 to line 14, col 159 of module random_03782
---*)
