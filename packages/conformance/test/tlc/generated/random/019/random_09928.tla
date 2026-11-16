(*---
description: Evaluates a random bool expression, seed 262, number 9928.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09928 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b15443 \in {-1 : b15444 \in {x \in 1..3 : x > 1}} : (FALSE \/ [x \in Nat |-> x + 1])} = {CASE TRUE -> 3 [] OTHER -> -1, Head(<<1, 2>>)}) => ((Len(<<1, 2>>) - Head(<<1, 2>>)) < LET b15445 == IF TRUE THEN 3 ELSE 2 IN (<<5, 6>>)[b15445])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09928 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a function of the form  [x \in S |-> expr].
    line 14, col 72 to line 14, col 101 of module random_09928
---*)
