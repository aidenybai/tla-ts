(*---
description: Evaluates a random function expression, seed 262, number 9735.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09735 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![CASE (Head(<<3, 1, 2>>) < ([x \in 1..2 |-> x])[0]) -> (CHOOSE b15112 \in {b15113 \in {x \in 1..3 : x > 1} : TRUE} : ([a |-> 1] = [a |-> 1])) [] OTHER -> (([x \in Nat |-> x + 1] @@ FALSE))[LET b15114 == FALSE IN b15114]] = (IF (3 < -1) THEN (CHOOSE b15115 \in Nat : FALSE) ELSE Head(<<1>>) * Head((FALSE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09735 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    0
    which is not in its domain.
---*)
