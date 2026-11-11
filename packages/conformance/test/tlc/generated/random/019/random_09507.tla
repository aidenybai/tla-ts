(*---
description: Evaluates a random int expression, seed 262, number 9507.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09507 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (~(Append(<<1, 2>>, 2147483647) = (2147483647 :> 0))) -> (CHOOSE b14764 \in (\E b14765 \in (Nat \cup {x \in 1..3 : x > 1}) : ([a |-> 1] = [a |-> 1])) : ((\A b14766 \in SUBSET {1} : <<>>) <=> (b14764 \in {2, 1, 3}))) [] OTHER -> ([a |-> (<<1, 2>>).a, b |-> (\E b14767 \in [x \in Nat |-> x + 1] : TRUE)] = [a |-> LET b14768 == 0 IN b14768, b |-> (-1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09507 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    Nat
    are not both enumerable
---*)
