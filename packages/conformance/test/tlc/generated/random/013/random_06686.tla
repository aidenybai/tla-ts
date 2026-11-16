(*---
description: Evaluates a random function expression, seed 262, number 6686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b10251 \in (\E b10252 \in {b10253 \in {2, 1, 3} : TRUE} : (<<1>> = <<5, 6>>)) |-> (Head(<<1, 2>>) + (CHOOSE b10254 \in 1..3 : TRUE))] EXCEPT ![(CHOOSE b10255 \in {(-2) : b10256 \in DOMAIN (1 :> 2)} : ((b10255 - 2) = ([a |-> 1]).a))] = (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06686 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 162 to line 14, col 247 of module random_06686
---*)
