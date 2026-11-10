(*---
description: Evaluates a random record expression, seed 262, number 8848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0) = [b13703 \in {2147483647 : b13704 \in 1..3} |-> (b13703 % 1)]) EXCEPT !.a = @ + ((CHOOSE b13705 \in DOMAIN 2 : (~TRUE)) * (Head(<<>>) * ([x \in 1..2 |-> x])[2]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08848 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
