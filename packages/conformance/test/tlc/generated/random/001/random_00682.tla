(*---
description: Evaluates a random int expression, seed 262, number 682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ({(-1 + [a |-> 1]) : b1138 \in {b1139 \in {} : [a |-> 1, b |-> TRUE]}} \subseteq {b1140 \in ({2, 1, 3} \cap {1, 2}) : (TRUE => FALSE)}) THEN (Len(Tail(<<>>)) - ((<<5, 6>> @@ <<5, 6>>))[Head(<<3, 1, 2>>)]) ELSE Cardinality({(b1141 \div b1141) : b1141 \in (Nat \cup {})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
