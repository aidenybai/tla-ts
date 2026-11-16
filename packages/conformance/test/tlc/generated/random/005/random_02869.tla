(*---
description: Evaluates a random set expression, seed 262, number 2869.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02869 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(SubSeq(SubSeq(<<>>, 1, TRUE), Len(<<>>), Head(<<1, 2>>)) + ((1 - 2) + (<<3, 1, 2>> \o <<1>>))), CASE ((--1) < (7 % 7)) -> CASE (FALSE /\ FALSE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> (3 - -1) [] OTHER -> [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = @ + (2147483647 % 2147483647)]})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 123 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 120.
    | Expression starting at line 14, column 120.
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 119.
    | Case Arm starting at line 14, column 119.
    | Fatal errors while parsing TLA+ spec in file random_02869
    | In module random_02869
    | Could not parse module random_02869 from file random_02869.tla
    | *** Errors: 1
    | In module random_02869
    | Could not parse module random_02869 from file random_02869.tla
    3002:1 Parsing or semantic analysis failed.
---*)
