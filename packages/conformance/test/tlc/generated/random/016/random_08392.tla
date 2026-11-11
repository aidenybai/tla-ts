(*---
description: Evaluates a random seq expression, seed 262, number 8392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Tail((<<1, 2>> \o <<1>>)) \o [[<<1>> EXCEPT ![1] = [a |-> 1]] EXCEPT ![1] = LET b12985 == TRUE IN 2]) EXCEPT ![1] = ((CHOOSE b12986 \in {1, 2} : ({} = {x \in 1..3 : x > 1})) + [(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + IF TRUE THEN 2147483647 ELSE 0])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08392 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 136 to line 14, col 189 of module random_08392
---*)
