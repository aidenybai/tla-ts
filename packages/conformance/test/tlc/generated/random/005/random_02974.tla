(*---
description: Evaluates a random function expression, seed 262, number 2974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE) EXCEPT ![CASE ((SUBSET {1} \cap {}) = ({2, 1, 3} \cup 7)) -> (CHOOSE b4721 \in {-1, 0} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) [] OTHER -> (CHOOSE b4722 \in {b4723 : b4723 \in Nat} : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))] = ((IF SUBSET {1} THEN 2 ELSE 0 - Head(<<1>>)) + [(3 + -1) EXCEPT !.a = @ + (-2147483647)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02974 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    7
    are not both enumerable
---*)
