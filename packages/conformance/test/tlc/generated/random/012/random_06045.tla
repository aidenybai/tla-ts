(*---
description: Evaluates a random function expression, seed 262, number 6045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((7 * 7) * IF FALSE THEN 7 ELSE 2) :> (CHOOSE b9311 \in DOMAIN (1 :> 2) : ((1 :> 2) \/ FALSE))) EXCEPT ![Head(Tail((<<3, 1, 2>> \o <<>>)))] = (Cardinality({3, 3}) - LET b9312 == (-1 % 7) IN (-b9312))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06045 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 93 to line 14, col 109 of module random_06045
---*)
