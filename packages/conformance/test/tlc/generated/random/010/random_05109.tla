(*---
description: Evaluates a random record expression, seed 262, number 5109.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05109 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (7 % 7), b |-> (1 = 3)] EXCEPT !.a = @ + (-(CHOOSE b7946 \in 2..1 : FALSE))] EXCEPT !.a = ((CASE FALSE -> 2147483647 [] OTHER -> 2147483647 :> ([x \in Nat |-> x + 1])[2147483647]))[(CHOOSE b7947 \in ({1, 2} \cap {1}) : ({1} = Nat))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05109 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 69 to line 14, col 97 of module random_05109
---*)
