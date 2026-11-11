(*---
description: Evaluates a random seq expression, seed 262, number 5935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(Tail(<<7, 1>>), (IF TRUE THEN 2 ELSE 0 + (1 :> 0)), (CHOOSE b9145 \in ({1} \cap {x \in 1..3 : x > 1}) : ([a |-> 1, b |-> TRUE] = 2..1))) EXCEPT ![1] = CASE ((\E b9146 \in {1} : TRUE) => (FALSE <=> FALSE)) -> ((CHOOSE f \in [{1, 2} -> {}] : TRUE))[([a |-> 1]).a] [] OTHER -> (Len(<<1>>) * (1 % -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05935 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 77 to line 14, col 157 of module random_05935
---*)
