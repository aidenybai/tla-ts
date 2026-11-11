(*---
description: Evaluates a random function expression, seed 262, number 1638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2621 \in {{b2622 : b2622 \in TRUE}, (-3)} |-> ([[a |-> 1] EXCEPT !.a = [a |-> 1, b |-> TRUE]]).a] @@ [b2623 \in {b2624 \in UNION {{x \in 1..3 : x > 1}, 2..1} : (7 = 1)} |-> (CASE FALSE -> b2623 [] OTHER -> b2623 % (CHOOSE b2625 \in SUBSET {1} : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01638 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 48 to line 14, col 51 of module random_01638
---*)
