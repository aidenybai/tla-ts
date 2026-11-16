(*---
description: Evaluates a random record expression, seed 262, number 4134.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04134 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = @ + IF (~(TRUE /\ FALSE)) THEN (Len(<<1, 2>>) - IF FALSE THEN 2 ELSE 1) ELSE (CASE FALSE -> 7 [] OTHER -> 1 \div IF TRUE THEN 2 ELSE 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04134 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 47 of module random_04134
---*)
