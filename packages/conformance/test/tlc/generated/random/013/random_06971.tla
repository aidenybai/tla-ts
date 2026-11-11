(*---
description: Evaluates a random function expression, seed 262, number 6971.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06971 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 * 1) :> (1..3 \subseteq {})) @@ [(<<5, 6>> @@ [x \in 1..2 |-> x]) EXCEPT ![([a |-> 1]).a] = Head(<<1, 2>>)]) @@ [b10663 \in (UNION {2..1, {1, 2}} \cap (CHOOSE b10664 \in {1, 2} : FALSE)) |-> (IF FALSE THEN b10663 ELSE (1 :> 2) - (CHOOSE b10665 \in FALSE : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06971 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 174 to line 14, col 205 of module random_06971
---*)
