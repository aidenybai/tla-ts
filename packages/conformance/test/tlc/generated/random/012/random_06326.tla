(*---
description: Evaluates a random function expression, seed 262, number 6326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([<<>> EXCEPT !.a = 3] = (CHOOSE r \in [a : {1}] : TRUE)) -> ({b9723 \in SUBSET {1} : TRUE} \cup {0, -1}) [] OTHER -> LET b9724 == (-1 + 0) IN (b9724 - b9724) :> ((IF TRUE THEN 2 ELSE 0 % (0 % 3)) % Cardinality((1..3 \cup 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06326 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
