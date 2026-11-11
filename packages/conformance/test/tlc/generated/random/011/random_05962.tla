(*---
description: Evaluates a random bool expression, seed 262, number 5962.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05962 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({IF FALSE THEN -1 ELSE -1, (2147483647 % 7)} = {(CHOOSE b9196 \in {1} : TRUE) : b9195 \in UNION {Nat, 2..1}}) /\ (((-1 = 2147483647) => (3 = 1)) \/ (Cardinality(SUBSET {1}) < (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 196 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 193.
    | ExtendableExpr starting at line 14, column 167.
    | Expression starting at line 14, column 167.
    | ExtendableExpr starting at line 14, column 166.
    | ExtendableExpr starting at line 14, column 132.
    | Fatal errors while parsing TLA+ spec in file random_05962
    | In module random_05962
    | Could not parse module random_05962 from file random_05962.tla
    | *** Errors: 1
    | In module random_05962
    | Could not parse module random_05962 from file random_05962.tla
    3002:1 Parsing or semantic analysis failed.
---*)
