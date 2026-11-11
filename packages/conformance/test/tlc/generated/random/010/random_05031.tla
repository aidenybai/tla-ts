(*---
description: Evaluates a random function expression, seed 262, number 5031.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE))[((1 :> 2))[7]] :> ((-0) * Len(2..1))) EXCEPT ![(Head(({2, 1, 3} \o <<>>)) - LET b7823 == (3 % 7) IN (3 * b7823))] = Cardinality({(CHOOSE b7824 \in 2..1 : FALSE), CASE FALSE -> 3 [] OTHER -> TRUE})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05031 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
