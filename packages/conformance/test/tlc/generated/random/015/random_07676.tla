(*---
description: Evaluates a random int expression, seed 262, number 7676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((7 - 2) = [b11818 \in {1} |-> b11818]) \/ ((<<1, 2>> \o <<1, 2>>) = [[x \in 1..2 |-> x] EXCEPT ![0] = 2147483647])) THEN Head((Append(<<1>>, 2) \o Tail(<<>>))) ELSE (CHOOSE b11819 \in ({2, -1} \ ((1 :> 2))[2147483647]) : (\E b11820 \in DOMAIN [x \in Nat |-> x + 1] : (\A b11821 \in b11820 : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07676 failed.
    Attempted to check equality of integer 5 with non-integer:
    <<1>>
---*)
