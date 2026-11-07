(*---
description: Evaluates a random seq expression, seed 262, number 6056.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq([(<<>> \o <<>>) EXCEPT ![1] = (1 + 3)], Len((<<3, 1, 2>> \o <<>>)), CASE (\E b9332 \in Nat : FALSE) -> (CHOOSE b9333 \in {} : FALSE) [] OTHER -> Head(<<>>)), (((-2) - Head(<<1>>)) * (Cardinality([a |-> 1]) % (3 + 7))), (((-2147483647) + (CHOOSE b9334 \in {2, 1, 3} : FALSE)) * ((--1) % Head(<<>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 311 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 308.
    | Expression starting at line 14, column 308.
    | ExtendableExpr starting at line 14, column 307.
    | ExtendableExpr starting at line 14, column 250.
    | Expression starting at line 14, column 250.
    | Fatal errors while parsing TLA+ spec in file random_06056
    | In module random_06056
    | Could not parse module random_06056 from file random_06056.tla
    | *** Errors: 1
    | In module random_06056
    | Could not parse module random_06056 from file random_06056.tla
    3002:1 Parsing or semantic analysis failed.
---*)
