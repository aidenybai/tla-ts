(*---
description: Evaluates a random set expression, seed 262, number 9538.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09538 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14823 \in (DOMAIN [x \in 1..2 |-> x] \cup {b14824 \in 2..1 : FALSE}) : (UNION {2..1, {2, 1, 3}} \subseteq {-1, 7})) .. (-IF (2..1 = {x \in 1..3 : x > 1}) THEN (CHOOSE b14825 \in {x \in 1..3 : x > 1} : FALSE) ELSE CASE TRUE -> 7 [] OTHER -> 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09538 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 139 of module random_09538
---*)
