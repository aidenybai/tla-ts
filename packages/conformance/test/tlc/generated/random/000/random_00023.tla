(*---
description: Evaluates a random record expression, seed 262, number 23.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE), b |-> ((TRUE <=> FALSE) => (FALSE \/ TRUE))] EXCEPT !.a = @ + IF (DOMAIN <<5, 6>> \subseteq (1..3 \ SUBSET {1})) THEN ((2 + 3) * (7 * 0)) ELSE (CHOOSE b31 \in ({1, 2} \ {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00023 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
