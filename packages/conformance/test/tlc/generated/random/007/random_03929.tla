(*---
description: Evaluates a random record expression, seed 262, number 3929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b6191 \in {1, 2} : FALSE), b |-> (~FALSE)] EXCEPT !.a = CASE (1 \in {1, 2}) -> ([x \in 1..2 |-> x])[7] [] OTHER -> CASE TRUE -> 0 [] OTHER -> 1] EXCEPT !.a = (CHOOSE b6192 \in (({} \cap {}) \cup UNION {{1}, {}}) : (\E b6193 \in {0, 7} : (SUBSET {1} \subseteq {})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03929 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 56 of module random_03929
---*)
