(*---
description: Evaluates a random function expression, seed 262, number 8470.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08470 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CHOOSE f \in [{} -> 1..2] : TRUE) @@ ([b13102 \in {2, 1, 3} |-> b13102] @@ [(1 :> 2) EXCEPT ![1] = 2])) EXCEPT ![(CHOOSE b13103 \in {([a |-> 1, b |-> TRUE]).a : b13104 \in {0, -1}} : (~(1..3 \subseteq 1..3)))] = CASE [(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = Head(<<3, 1, 2>>)] -> Cardinality({b13105 : b13105 \in {x \in 1..3 : x > 1}}) [] OTHER -> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08470 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 133 to line 14, col 225 of module random_08470
---*)
