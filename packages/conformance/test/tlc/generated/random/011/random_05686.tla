(*---
description: Evaluates a random seq expression, seed 262, number 5686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SubSeq(<<-1, 3>>, Len(<<3, 1, 2>>), (3 * 1)) \o <<([a |-> 1, b |-> TRUE]).a, (<<5, 6>>)[3]>>), [[a |-> Head(<<3, 1, 2>>), b |-> (TRUE /\ TRUE)] EXCEPT !.a = @ + (-(-1 \div 2))], (Cardinality((TRUE .. -1)) * Cardinality({2, 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<-1, 3>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<-1, 3>>
    , but instead it is
    3
---*)
