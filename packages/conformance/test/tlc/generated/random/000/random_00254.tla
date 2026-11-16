(*---
description: Evaluates a random record expression, seed 262, number 254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> Head(<<3, 1, 2>>), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1])] EXCEPT !.a = ([a |-> 2, b |-> TRUE]).a] EXCEPT !.a = @ + CASE ((-1 \subseteq {1, 2}) \/ (TRUE <=> <<>>)) -> ([<<5, 6>> EXCEPT ![7] = 2])[CASE FALSE -> 7 [] OTHER -> 1] [] OTHER -> (LET b426 == 2147483647 IN b426 % (CHOOSE b427 \in {1, 2} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00254 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 151 to line 14, col 169 of module random_00254
---*)
