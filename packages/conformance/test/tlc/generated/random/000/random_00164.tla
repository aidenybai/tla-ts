(*---
description: Evaluates a random record expression, seed 262, number 164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a, b |-> (\A b258 \in DOMAIN (1 :> 2) : (<<>> = <<5, 6>>))] EXCEPT !.a = (LET b259 == Len(<<1>>) IN Len(<<3, 1, 2>>) \div (CHOOSE b260 \in ({} \cap {1, 2}) : (TRUE \/ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00164 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 193 to line 14, col 242 of module random_00164
---*)
