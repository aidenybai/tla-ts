(*---
description: Evaluates a random seq expression, seed 262, number 8773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (CHOOSE r \in [a : {1, 2}] : TRUE) THEN (7 + 2) ELSE Cardinality(SUBSET {1}) % ((CHOOSE b13585 \in SUBSET {1} : FALSE) \div Head(<<>>))) * (LET b13586 == CASE FALSE -> FALSE [] OTHER -> 2147483647 IN (CHOOSE b13587 \in {x \in 1..3 : x > 1} : TRUE) \div ((--1) - [a |-> 2, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 278 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 275.
    | Expression starting at line 14, column 275.
    | ExtendableExpr starting at line 14, column 274.
    | ExtendableExpr starting at line 14, column 221.
    | Expression starting at line 14, column 221.
    | Fatal errors while parsing TLA+ spec in file random_08773
    | In module random_08773
    | Could not parse module random_08773 from file random_08773.tla
    | *** Errors: 1
    | In module random_08773
    | Could not parse module random_08773 from file random_08773.tla
    3002:1 Parsing or semantic analysis failed.
---*)
