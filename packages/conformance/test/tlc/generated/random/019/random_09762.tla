(*---
description: Evaluates a random function expression, seed 262, number 9762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b15156 \in {7, <<1>>} |-> Head(<<1>>)] @@ [[b15157 \in {1, 2} |-> b15157] EXCEPT ![([a |-> 1, b |-> TRUE]).a] = Tail(<<3, 1, 2>>)]) @@ UNION {{b15158 \in DOMAIN (1 :> 2) : (<<1>> = [x \in Nat |-> x + 1])}, {b15159 \in ({} \cup {2, 1, 3}) : (TRUE => TRUE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09762 failed.
    Attempted to compare the function <<1>> with the value:
    7
---*)
