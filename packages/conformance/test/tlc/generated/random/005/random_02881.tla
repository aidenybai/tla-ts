(*---
description: Evaluates a random record expression, seed 262, number 2881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Cardinality({}), b |-> (2..1 = <<5, 6>>)] EXCEPT !.a = @ + ((CHOOSE b4568 \in {1} : TRUE) % IF [x \in Nat |-> x + 1] THEN 7 ELSE 1)] EXCEPT !.a = @ + (CHOOSE b4569 \in ({[a |-> 1], 3} \cup ({} \cup {1})) : ((b4569 + b4569) \in ({1} \cup Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02881 failed.
    Attempted to check equality of the set {} with the value:
    <<5, 6>>
---*)
