(*---
description: Evaluates a random record expression, seed 262, number 4062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (<<IF FALSE THEN 7 ELSE 3, (0 % 3)>> \div IF (<<1>> \subseteq Nat) THEN [<<1>> EXCEPT ![1] = 3] ELSE (CHOOSE b6394 \in {x \in 1..3 : x > 1} : FALSE)), b |-> (Tail((<<1, 2>> \o <<1, 2>>)) = (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04062 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 69 to line 14, col 87 of module random_04062
---*)
