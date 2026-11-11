(*---
description: Evaluates a random set expression, seed 262, number 6849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{((CHOOSE b10503 \in SUBSET {1} : TRUE) % (<<5, 6>>)[-1]), ([[x \in 1..2 |-> x] EXCEPT ![(1 :> 2)] = 3])[Cardinality({})]}, {(LET b10504 == 7 IN b10504 * LET b10505 == 3 IN 7), IF (TRUE => FALSE) THEN Head(<<1>>) ELSE (2 + 2)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06849 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
