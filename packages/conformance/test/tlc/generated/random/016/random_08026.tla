(*---
description: Evaluates a random record expression, seed 262, number 8026.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08026 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([CASE <<1, 2>> -> 2 [] OTHER -> 3 EXCEPT !.a = @ + (CHOOSE b12383 \in {x \in 1..3 : x > 1} : TRUE)]).a, b |-> (SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08026 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 30 to line 14, col 37 of module random_08026
---*)
