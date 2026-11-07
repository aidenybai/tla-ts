(*---
description: Evaluates a random record expression, seed 262, number 4243.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04243 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = IF TRUE THEN 7 ELSE 0] EXCEPT !.a = (CHOOSE b6675 \in UNION {(1 :> 2), {x \in 1..3 : x > 1}} : (b6675 < b6675))] EXCEPT !.a = @ + ([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + IF FALSE THEN 2147483647 ELSE TRUE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04243 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 47 of module random_04243
---*)
