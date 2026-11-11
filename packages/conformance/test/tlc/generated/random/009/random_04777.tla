(*---
description: Evaluates a random int expression, seed 262, number 4777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE SelectSeq(<<>>, LAMBDA e : e > 0) -> [[a |-> 1] EXCEPT !.a = @ + 1] [] OTHER -> ((1 :> 2))[-1] % (CHOOSE b7457 \in DOMAIN (1 :> 2) : (<<1, 2>> = <<1, 2>>))) - [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (CHOOSE b7458 \in (2..1 \ 2..1) : (b7458 < b7458))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04777 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 23 to line 14, col 55 of module random_04777
---*)
