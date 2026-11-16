(*---
description: Evaluates a random int expression, seed 262, number 6004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([[a |-> [x \in Nat |-> x + 1], b |-> TRUE] EXCEPT !.a = (--1)] = [a |-> Len(<<1>>), b |-> (~FALSE)]) THEN (-((-7) * (CHOOSE b9251 \in SUBSET {1} : TRUE))) ELSE (Cardinality({b9252 \in {1} : TRUE}) - (Cardinality(2..1) % Head(<<1>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 79 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | Except Spec starting at line 14, column 70.
    | Some [] Form starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 20.
    | Fatal errors while parsing TLA+ spec in file random_06004
    | In module random_06004
    | Could not parse module random_06004 from file random_06004.tla
    | *** Errors: 1
    | In module random_06004
    | Could not parse module random_06004 from file random_06004.tla
    3002:1 Parsing or semantic analysis failed.
---*)
