(*---
description: Evaluates a random int expression, seed 262, number 6047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9315 == [a |-> Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), b |-> (\A b9316 \in ([x \in 1..2 |-> x])[2147483647] : (<<>> = [x \in 1..2 |-> x]))] IN (CHOOSE b9317 \in {(b9315 - b9315), ([a |-> 1, b |-> TRUE]).a} : ((<<>> = [x \in Nat |-> x + 1]) /\ (FALSE /\ TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06047 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
