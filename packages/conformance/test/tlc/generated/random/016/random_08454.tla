(*---
description: Evaluates a random set expression, seed 262, number 8454.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08454 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (\E b13082 \in (Nat \cup SUBSET {1}) : (<<1>> = [x \in 1..2 |-> x])) THEN [[a |-> -1, b |-> FALSE] EXCEPT !.a = ((1 :> 2) @@ <<5, 6>>)] ELSE Head({b13083 : b13083 \in 2..1}), Len([Tail(<<1, 2>>) EXCEPT ![1] = (-1 + 7)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08454 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    {{}, {1}}
    are not both enumerable
---*)
