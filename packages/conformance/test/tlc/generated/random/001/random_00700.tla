(*---
description: Evaluates a random function expression, seed 262, number 700.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00700 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) @@ [b1164 \in 2..1 |-> 7]) EXCEPT ![CASE (FALSE \/ TRUE) -> ([x \in 1..2 |-> x])[3] [] OTHER -> (CHOOSE b1165 \in {1, 2} : TRUE)] = (Cardinality((1 :> 2)) * ([a |-> 1]).a)] EXCEPT ![(Cardinality({2 : b1166 \in SUBSET {1}}) \div (([x \in Nat |-> x + 1])[-1] % Head(<<1, 2>>)))] = Cardinality(((<<5, 6>>).a .. ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00700 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
