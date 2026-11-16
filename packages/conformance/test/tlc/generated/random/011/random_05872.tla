(*---
description: Evaluates a random function expression, seed 262, number 5872.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05872 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b9055 \in (IF [a |-> 1, b |-> TRUE] THEN 7 ELSE 3 .. (2147483647 + 0)) : ((~TRUE) /\ ({x \in 1..3 : x > 1} \subseteq {x \in 1..3 : x > 1}))}, (((Nat \cap {}) \cap DOMAIN [x \in 1..2 |-> x]) \ (CASE FALSE -> 3 [] OTHER -> 2 .. IF [a |-> 1] THEN 3 ELSE 7))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05872 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 35 to line 14, col 92 of module random_05872
---*)
