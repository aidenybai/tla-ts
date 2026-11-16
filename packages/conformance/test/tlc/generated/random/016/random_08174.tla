(*---
description: Evaluates a random int expression, seed 262, number 8174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b12643 \in {-1, 1} |-> Head(<<>>)] EXCEPT ![((CHOOSE r \in [a : {1, 2}] : TRUE))[LET b12644 == 7 IN {2, 1, 3}]] = CASE (Nat = {1}) -> (CHOOSE b12645 \in {1} : (1 :> 2)) [] OTHER -> Append(<<1, 2>>, 2147483647)])[(-(~(FALSE => FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08174 failed.
    Attempted to access record by a non-string argument: {1, 2, 3}
---*)
