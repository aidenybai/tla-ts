(*---
description: Evaluates a random int expression, seed 262, number 6720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10301 \in UNION {{b10302 \in (7 .. -1) : ({} = 1..3)}, ((2147483647 .. -1) \cup {TRUE, 7})} : ((-((1 :> 2))[b10301]) \in [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (b10301 \div 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06720 failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    7
---*)
