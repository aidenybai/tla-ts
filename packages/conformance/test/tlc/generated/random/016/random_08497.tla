(*---
description: Evaluates a random int expression, seed 262, number 8497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b13154 \in {b13155 \in ([b13156 \in 2..1 |-> b13156] \cap (FALSE => FALSE)) : ((\E b13157 \in {x \in 1..3 : x > 1} : {2, 1, 3}) <=> (b13155 < 0))} : (([[a |-> 1] EXCEPT !.a = 1] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b13154]) => (\A b13158 \in ({1} \ <<1, 2>>) : (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08497 failed.
    Attempted to enumerate S \cap T when neither S:
    <<>>
    nor T:
    TRUE
    is enumerable
---*)
