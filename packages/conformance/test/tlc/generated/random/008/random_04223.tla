(*---
description: Evaluates a random seq expression, seed 262, number 4223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SelectSeq((<<3, 1, 2>> \o <<1, 2>>), LAMBDA e : e > 0) EXCEPT ![1] = CASE (Nat \subseteq {x \in 1..3 : x > 1}) -> (2 \div [a |-> 1]) [] OTHER -> (CHOOSE b6638 \in 2..1 : FALSE)] EXCEPT ![1] = (CHOOSE b6639 \in ((2 + 2) .. IF TRUE THEN FALSE ELSE -1) : ((0 = b6639) /\ (FALSE => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04223 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 93 to line 14, col 126 of module random_04223
---*)
