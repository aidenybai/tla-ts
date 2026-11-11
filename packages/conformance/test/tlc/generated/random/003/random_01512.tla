(*---
description: Evaluates a random set expression, seed 262, number 1512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len((<<-1, 7>> \o <<2147483647, 1>>)) .. (-IF (3 \in SUBSET {1}) THEN ([a |-> 1]).a ELSE (--1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 109 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 106.
    | Expression starting at line 14, column 106.
    | IF THEN ELSE starting at line 14, column 60.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | Fatal errors while parsing TLA+ spec in file random_01512
    | In module random_01512
    | Could not parse module random_01512 from file random_01512.tla
    | *** Errors: 1
    | In module random_01512
    | Could not parse module random_01512 from file random_01512.tla
    3002:1 Parsing or semantic analysis failed.
---*)
