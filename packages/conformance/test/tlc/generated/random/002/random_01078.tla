(*---
description: Evaluates a random function expression, seed 262, number 1078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b1718 \in ((1..3 \ 2..1) \cap (2 .. 1)) |-> (-(b1718 + b1718))] EXCEPT ![CASE ((1..3 \subseteq Nat) /\ (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE)) -> [[a |-> 7, b |-> FALSE] EXCEPT !.a = CASE FALSE -> 2 [] OTHER -> 7] [] OTHER -> LET b1719 == CASE TRUE -> 0 [] OTHER -> 7 IN (CHOOSE b1720 \in 1..3 : FALSE)] = ((Len(<<5, 6>>) - ([a |-> 1, b |-> TRUE]).a) + ((7 + -1) * Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01078 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 97 to line 14, col 160 of module random_01078
---*)
