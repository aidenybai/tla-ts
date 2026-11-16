(*---
description: Evaluates a random int expression, seed 262, number 3940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq((<<7, 2147483647>> \o SubSeq(<<>>, SUBSET {1}, -1)), LAMBDA e : e > 0) EXCEPT ![1] = (CASE (TRUE => TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> (--1) * IF (2147483647 = 2147483647) THEN IF FALSE THEN -1 ELSE 0 ELSE CASE 1 -> 0 [] OTHER -> -1)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 177 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 174.
    | Expression starting at line 14, column 174.
    | Case Other Arm starting at line 14, column 165.
    | CASE Expression starting at line 14, column 113.
    | Expression starting at line 14, column 113.
    | Fatal errors while parsing TLA+ spec in file random_03940
    | In module random_03940
    | Could not parse module random_03940 from file random_03940.tla
    | *** Errors: 1
    | In module random_03940
    | Could not parse module random_03940 from file random_03940.tla
    3002:1 Parsing or semantic analysis failed.
---*)
