(*---
description: Evaluates a random record expression, seed 262, number 1672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF ([a |-> 1] = [a |-> 1]) THEN (CHOOSE b2666 \in {2, 1, 3} : FALSE) ELSE CASE TRUE -> 0 [] OTHER -> 1 * (UNION {2..1, 1..3} \cap (2147483647 .. 0))), b |-> ([[[a |-> 1] EXCEPT ![2147483647] = 3] EXCEPT ![(1 = 2147483647)] = IF FALSE THEN 2 ELSE 3] = [a |-> (CHOOSE b2667 \in Nat : TRUE), b |-> (FALSE /\ 3)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01672 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 57 to line 14, col 90 of module random_01672
---*)
