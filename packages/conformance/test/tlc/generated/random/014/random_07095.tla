(*---
description: Evaluates a random function expression, seed 262, number 7095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10895 \in ((SUBSET {1} \ {1, 2}) \cap DOMAIN (1 :> 2)) |-> ((CHOOSE b10896 \in {1, 2} : TRUE) - Len(<<1>>))] EXCEPT ![((([a |-> 1]).a * (CHOOSE b10897 \in {2, 1, 3} : TRUE)) - (IF FALSE THEN -1 ELSE -1 % Cardinality(SUBSET {1})))] = Cardinality(Append((<<1>> \o <<3, 1, 2>>), Cardinality({2, 1, 3})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07095 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
