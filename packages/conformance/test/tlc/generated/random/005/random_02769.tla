(*---
description: Evaluates a random set expression, seed 262, number 2769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((<<1, 2>> = [x \in 1..2 |-> x]) <=> (1..3 = Nat)) -> (-IF TRUE THEN b4368 ELSE 1) [] OTHER -> UNION {({x \in 1..3 : x > 1} \cup 1..3), (<<5, 6>> \cup [a |-> 1, b |-> TRUE])} : b4368 \in ((CHOOSE b4369 \in {b4370 \in 2..1 : TRUE} : (FALSE => TRUE)) .. (Head(<<3, 1, 2>>) * (0 - <<1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02769 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 211 to line 14, col 268 of module random_02769
---*)
