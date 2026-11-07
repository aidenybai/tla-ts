(*---
description: Evaluates a random bool expression, seed 262, number 9079.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09079 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14105 \in ((CHOOSE b14106 \in {b14107 : b14107 \in 1..3} : (<<>> = [x \in Nat |-> x + 1])) .. (CHOOSE b14108 \in {b14109 \in SUBSET {1} : FALSE} : (SUBSET {1} \subseteq {1}))) : (\A b14110 \in ({b14111 \in 1..3 : TRUE} \cup {b14112 : b14112 \in {2, 1, 3}}) : (([a |-> 1] = <<5, 6>>) \/ ({1, 2} \subseteq SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09079 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
