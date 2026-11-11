(*---
description: Evaluates a random bool expression, seed 262, number 2807.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02807 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([a |-> 7, b |-> TRUE] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) -> (Cardinality({}) + (2147483647 \div 0)) [] OTHER -> Head(Tail(<<3, 1, 2>>)) = (LET b4456 == (--1) IN (<<5, 6>>)[7] - Cardinality(({} \cup {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 190 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | Definition starting at line 14, column 178.
    | Let Definitions starting at line 14, column 178.
    | Case Other Arm starting at line 14, column 174.
    | Fatal errors while parsing TLA+ spec in file random_02807
    | In module random_02807
    | Could not parse module random_02807 from file random_02807.tla
    | *** Errors: 1
    | In module random_02807
    | Could not parse module random_02807 from file random_02807.tla
    3002:1 Parsing or semantic analysis failed.
---*)
