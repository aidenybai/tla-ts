(*---
description: Evaluates a random int expression, seed 262, number 2011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3186 \in UNION {({x \in 1..3 : x > 1} \ Nat), ({2, 1, 3} \cap {})} |-> (CHOOSE b3187 \in DOMAIN <<5, 6>> : [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2])])[(CHOOSE b3188 \in {(b3189 % 1) : b3189 \in {b3190 \in {} : FALSE}} : (IF TRUE THEN b3188 ELSE b3188 = (-1 :> -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02011 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 173 to line 14, col 284 of module random_02011
---*)
