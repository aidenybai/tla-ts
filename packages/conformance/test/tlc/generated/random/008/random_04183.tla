(*---
description: Evaluates a random function expression, seed 262, number 4183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([((1 :> 2) => TRUE) EXCEPT ![Head(<<3, 1, 2>>)] = ([x \in Nat |-> x + 1])[7]] @@ [b6579 \in {1, 1} |-> IF TRUE THEN 7 ELSE b6579]) EXCEPT ![(([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 2147483647] @@ (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE)))[Len(SubSeq(<<>>, 7, 2147483647))]] = (IF (TRUE => TRUE) THEN ([x \in Nat |-> x + 1])[[a |-> 1, b |-> TRUE]] ELSE CASE FALSE -> 0 [] OTHER -> 2 + (CHOOSE b6580 \in DOMAIN 7 : ({2, 1, 3} \ {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04183 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 20 to line 14, col 35 of module random_04183
---*)
