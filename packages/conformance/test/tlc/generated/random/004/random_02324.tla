(*---
description: Evaluates a random seq expression, seed 262, number 2324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<(CHOOSE b3682 \in ({} \cap SUBSET {1}) : (FALSE <=> TRUE)), LET b3683 == ((1 :> 2))[0] IN [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b3683]>> EXCEPT ![1] = LET b3684 == IF (1 < 2) THEN IF FALSE THEN 3 ELSE 2147483647 ELSE CASE TRUE -> 2147483647 [] OTHER -> [a |-> 1] IN IF (b3684 < 0) THEN Len(<<3, 1, 2>>) ELSE Head(<<>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02324 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 75 of module random_02324
---*)
