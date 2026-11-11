(*---
description: Evaluates a random int expression, seed 262, number 149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b228 \in {([[x \in 1..2 |-> x] EXCEPT ![2147483647] = b229])[(-b229)] : b229 \in (UNION {1..3, 2..1} \cup SubSeq(<<3, 1, 2>>, 1, 3))} : ({Head(<<3, 1, 2>>) : b230 \in (3 .. 1)} \subseteq ((FALSE => TRUE) => (FALSE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00149 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    <<3, 1, 2>>
    are not both enumerable
---*)
