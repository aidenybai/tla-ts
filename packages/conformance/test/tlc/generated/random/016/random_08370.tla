(*---
description: Evaluates a random seq expression, seed 262, number 8370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE b12948 \in (<<3, 1, 2>> \cup {2, 1, 3}) : (2..1 \subseteq {})) % ((2147483647 :> -1) @@ (2147483647 % -1))), CASE ((CHOOSE b12949 \in Nat : TRUE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1])) -> (([a |-> 1] = [a |-> 1, b |-> TRUE]))[(7 + 7)] [] OTHER -> Len(Append(<<3, 1, 2>>, 3))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08370 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    <<3, 1, 2>>
    are not both enumerable
---*)
