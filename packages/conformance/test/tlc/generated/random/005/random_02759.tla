(*---
description: Evaluates a random record expression, seed 262, number 2759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CASE TRUE -> 1 [] OTHER -> 0 \div (1 .. 2)), b |-> (SubSeq(<<1, 2>>, 2147483647, 0) = ((1 :> 2) @@ <<5, 6>>))] EXCEPT !.a = IF (~(SUBSET {1} = SUBSET {1})) THEN Len([<<1, 2>> EXCEPT ![1] = -1]) ELSE (CHOOSE b4351 \in (1..3 \cap 2..1) : (CHOOSE r \in [a : {0} \cup {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02759 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 225 to line 14, col 300 of module random_02759
---*)
