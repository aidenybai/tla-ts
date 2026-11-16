(*---
description: Evaluates a random seq expression, seed 262, number 5291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail((\A b8193 \in (7 \cup {1}) : SelectSeq(<<>>, LAMBDA e : e > 0))) EXCEPT ![1] = (CHOOSE b8194 \in (DOMAIN (1 :> 2) \ {3 : b8195 \in SUBSET {1}}) : (({1} \cap {1}) = {b8196 \in {1} : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05291 failed.
    Attempted to enumerate S \cup T when S:
    {1}
    and T:
    7
    are not both enumerable
---*)
