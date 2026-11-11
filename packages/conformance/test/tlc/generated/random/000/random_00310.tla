(*---
description: Evaluates a random function expression, seed 262, number 310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Head(Append(<<>>, 7)), CASE (FALSE \/ FALSE) -> CASE TRUE -> -1 [] OTHER -> 7 [] OTHER -> Len(<<1, 2>>)>>, CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = <<3, 1, 2>>] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)) -> (CHOOSE b519 \in {1, 7} : (FALSE /\ FALSE)) [] OTHER -> DOMAIN (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00310 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 295 to line 14, col 334 of module random_00310
---*)
