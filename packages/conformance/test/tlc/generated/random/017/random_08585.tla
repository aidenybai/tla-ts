(*---
description: Evaluates a random seq expression, seed 262, number 8585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(((<<>> \o TRUE) \o Tail(<<>>)), Len(<<{1}, 1>>)) EXCEPT ![1] = IF (Cardinality(SUBSET {1}) = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)) THEN Head(Append(<<1>>, 7)) ELSE Len(SortSeq(<<>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    TRUE
---*)
