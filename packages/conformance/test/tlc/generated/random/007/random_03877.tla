(*---
description: Evaluates a random function expression, seed 262, number 3877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality({b6102 \in {2, 1, 3} : TRUE}) :> (([x \in 1..2 |-> x] @@ (1 :> 2)))[(0 + 3)]) EXCEPT ![((Cardinality(3) * IF TRUE THEN 2 ELSE 7) \div (-{<<3, 1, 2>> : b6103 \in {2, 1, 3}}))] = (CHOOSE b6104 \in ((CHOOSE b6105 \in SUBSET {1} : TRUE) .. (<<5, 6>>)[-1]) : ((TRUE => FALSE) => (Nat = 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03877 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 3, which is not in the domain of the function.
---*)
