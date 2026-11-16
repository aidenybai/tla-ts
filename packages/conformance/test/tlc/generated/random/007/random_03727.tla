(*---
description: Evaluates a random int expression, seed 262, number 3727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {(-7), {b5885 \in {} : FALSE}}) + ([(CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE) EXCEPT ![Len(<<3, 1, 2>>)] = LET b5886 == -1 IN b5886])[(-(--1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 174 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 171.
    | Expression starting at line 14, column 170.
    | ExtendableExpr starting at line 14, column 169.
    | Expression starting at line 14, column 169.
    | Some [] Form starting at line 14, column 168.
    | Fatal errors while parsing TLA+ spec in file random_03727
    | In module random_03727
    | Could not parse module random_03727 from file random_03727.tla
    | *** Errors: 1
    | In module random_03727
    | Could not parse module random_03727 from file random_03727.tla
    3002:1 Parsing or semantic analysis failed.
---*)
