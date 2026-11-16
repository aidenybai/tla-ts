(*---
description: Evaluates a random set expression, seed 262, number 3851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((1 .. 3) \cap {b6063 \in {} : FALSE}), {b6064 \in {b6065 \in {1} : FALSE} : (b6064 /\ TRUE)}} \cap (UNION {({} \cap SUBSET {1}), ([a |-> 1] \cup {2, 1, 3})} \cap {IF TRUE THEN <<1, 2>> ELSE 2, Len(<<1>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03851 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    [a |-> 1]
    are not both enumerable
---*)
