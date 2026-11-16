(*---
description: Evaluates a random function expression, seed 262, number 9427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b14625 \in {1} : TRUE) + (CHOOSE b14626 \in SUBSET {1} : FALSE)) % CASE (<<>> = (1 :> 2)) -> (-1 % 2147483647) [] OTHER -> (CHOOSE b14627 \in Nat : TRUE)) :> (Len(<<1, 3>>) - LET b14628 == (-3) IN (2147483647 \div 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09427 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 53 to line 14, col 88 of module random_09427
---*)
