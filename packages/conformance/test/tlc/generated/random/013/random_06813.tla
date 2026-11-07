(*---
description: Evaluates a random int expression, seed 262, number 6813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b10445 \in ([a |-> (7 - -1), b |-> (Nat \ {})] \cap {b10446 \in ({1} \cup {x \in 1..3 : x > 1}) : (1..3 \ {1})}) : (\A b10447 \in UNION {UNION {2..1, {2, 1, 3}}, {b10448 \in {x \in 1..3 : x > 1} : FALSE}} : (UNION {Nat, SUBSET {1}} \subseteq ({1} \cup 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06813 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form {e1, ... ,eN}.
    line 14, col 123 to line 14, col 132 of module random_06813
---*)
