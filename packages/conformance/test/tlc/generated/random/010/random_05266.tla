(*---
description: Evaluates a random record expression, seed 262, number 5266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (IF (CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) THEN LET b8149 == 1 IN b8149 ELSE (<<1>> % 1) \div CASE (1 \in Nat) -> (2147483647)[1] [] OTHER -> (\E b8150 \in {1, 2} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05266 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as the condition of an IF.
    line 14, col 76 to line 14, col 250 of module random_05266
---*)
