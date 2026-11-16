(*---
description: Evaluates a random set expression, seed 262, number 9060.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b14081 \in (\A b14082 \in ((1..3 \cup Nat) \cup DOMAIN (1 :> 2)) : ((<<1>> \o <<>>) \o [<<>> EXCEPT ![1] = b14082])) : ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = (0 + 3)] = ((CHOOSE b14083 \in {1, 2} : TRUE) * LET b14084 == 3 IN 7))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09060 failed.
    Attempted to enumerate S \cup T when S:
    1..3
    and T:
    Nat
    are not both enumerable
---*)
