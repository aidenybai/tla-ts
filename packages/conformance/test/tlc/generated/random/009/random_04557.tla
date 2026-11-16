(*---
description: Evaluates a random bool expression, seed 262, number 4557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0) = ((SUBSET {1} \cup 2..1) = {b7146 \in Nat : FALSE})) /\ ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (CHOOSE b7147 \in {x \in 1..3 : x > 1} : [a |-> 1, b |-> TRUE])] = [a |-> (3 - -1), b |-> (FALSE <=> FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04557 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
