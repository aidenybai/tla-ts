(*---
description: Evaluates a random set expression, seed 262, number 6304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cup (SUBSET {1} \cap SUBSET {1})) \cap (UNION {{x \in 1..3 : x > 1}, 1..3} \cap (Nat \cap {2, 1, 3}))) \ (DOMAIN [b9694 \in {x \in 1..3 : x > 1} |-> b9694] \ ((CHOOSE b9695 \in {x \in 1..3 : x > 1} : TRUE) .. (1 * 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06304 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
