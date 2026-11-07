(*---
description: Evaluates a random int expression, seed 262, number 7952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12277 \in DOMAIN [b12278 \in {b12279 \in 1..3 : (1 :> 2)} |-> (b12278 + b12278)] |-> (Len((<<1, 2>> \o <<>>)) + SelectSeq((<<3, 1, 2>> \o <<3, 1, 2>>), LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07952 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 67 to line 14, col 72 of module random_07952
---*)
