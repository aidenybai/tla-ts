(*---
description: Evaluates a random int expression, seed 262, number 8485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE))[(-Cardinality(SUBSET {1}))] * (CHOOSE b13133 \in (CASE FALSE -> 1 [] OTHER -> 7 .. (1 + 7)) : (IF FALSE THEN b13133 ELSE {1, 2} \in {-1 : b13134 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08485 failed.
    Attempted to apply function:
    <<1, 1, 1>>
    to argument -2, which is not in the domain of the function.
---*)
