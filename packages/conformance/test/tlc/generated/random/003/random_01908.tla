(*---
description: Evaluates a random bool expression, seed 262, number 1908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{} -> 1..2] : TRUE) /\ (DOMAIN [x \in Nat |-> x + 1] \subseteq (0 .. 1))) => (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] = [<<>> EXCEPT !.a = 2147483647]) <=> (\E b2995 \in {<<5, 6>> : b2996 \in 1..3} : (b2995 = <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01908 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 18 to line 14, col 104 of module random_01908
---*)
