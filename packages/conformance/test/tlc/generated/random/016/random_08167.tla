(*---
description: Evaluates a random function expression, seed 262, number 8167.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08167 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE) EXCEPT ![([b12634 \in DOMAIN [x \in 1..2 |-> x] |-> ([x \in 1..2 |-> x] @@ <<5, 6>>)])[(Len(<<>>) * CASE TRUE -> 7 [] OTHER -> 3)]] = LET b12635 == IF (TRUE => FALSE) THEN (CHOOSE b12636 \in <<5, 6>> : FALSE) ELSE (2147483647 % 2147483647) IN Cardinality({b12637 \in Nat : FALSE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08167 failed.
    In applying the function
    <<<<1, 2>>, <<1, 2>>>>,
    the first argument is:
    0
    which is not in its domain.
---*)
