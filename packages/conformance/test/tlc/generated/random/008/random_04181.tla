(*---
description: Evaluates a random record expression, seed 262, number 4181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (<<3, 1, 2>> = [x \in 1..2 |-> x]) -> (2 % 3) [] OTHER -> CASE FALSE -> 0 [] OTHER -> 7, b |-> ((-7) = (CHOOSE b6577 \in {2, 1, 3} : TRUE))] EXCEPT !.a = @ + (-IF (\A b6578 \in {1, 2} : TRUE) THEN ([a |-> 1]).a ELSE Cardinality({}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 6, b |-> FALSE]"
---*)
