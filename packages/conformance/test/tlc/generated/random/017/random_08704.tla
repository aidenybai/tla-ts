(*---
description: Evaluates a random bool expression, seed 262, number 8704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13479 \in ({(-1), (1 % 0)} \cap ({0 : b13480 \in {}} \ (1..3 \ SUBSET {1}))) : ((({2, 1, 3} \ 1..3) = ({2, 1, 3} \cap SUBSET {1})) /\ ({b13481 \in {1, 2} : TRUE} \subseteq DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08704 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
