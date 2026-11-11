(*---
description: Evaluates a random bool expression, seed 262, number 9476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(<<-1, 7>>) = Head(SubSeq(<<1>>, 2, -1))) => (CASE (~TRUE) -> (--1) [] OTHER -> (-2) < CASE (TRUE \/ FALSE) -> (CHOOSE r \in [a : {2, 1, 3}] : TRUE) [] OTHER -> (2147483647 * 0))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 86 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | Case Arm starting at line 14, column 72.
    | CASE Expression starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | Fatal errors while parsing TLA+ spec in file random_09476
    | In module random_09476
    | Could not parse module random_09476 from file random_09476.tla
    | *** Errors: 1
    | In module random_09476
    | Could not parse module random_09476 from file random_09476.tla
    3002:1 Parsing or semantic analysis failed.
---*)
