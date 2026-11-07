(*---
description: Evaluates a random set expression, seed 262, number 1984.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01984 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat \cup 1..3) \cup {b3143 \in SUBSET {1} : FALSE}) \ {Cardinality({x \in 1..3 : x > 1}), Head(<<1, 2>>)}) \cap {(CHOOSE b3145 \in UNION {SUBSET {1}, 2..1} : (FALSE /\ [a |-> 1, b |-> TRUE])) : b3144 \in ((2..1 \cup Nat) \cup (<<3, 1, 2>> \cup {1, 2}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01984 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    {1, 2} \cup <<3, 1, 2>>
    are not both enumerable
---*)
