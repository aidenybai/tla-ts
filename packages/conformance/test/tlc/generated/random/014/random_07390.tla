(*---
description: Evaluates a random function expression, seed 262, number 7390.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07390 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b11374 \in UNION {DOMAIN (1 :> 2), UNION {{1, 2}, 2..1}} |-> (([x \in 1..2 |-> x])[b11374] % (2147483647 * 3))] EXCEPT ![IF ((<<1, 2>> = 2) \/ (TRUE <=> TRUE)) THEN LET b11375 == (-2147483647) IN (FALSE <=> FALSE) ELSE ((<<1, 2>>)[-1] - (CHOOSE b11376 \in {1, 2} : TRUE))] = Cardinality((UNION {{}, {1}} \cap ({2, 1, 3} \cap 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07390 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    2
---*)
