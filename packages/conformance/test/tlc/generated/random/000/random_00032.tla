(*---
description: Evaluates a random record expression, seed 262, number 32.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CASE ([a |-> 1] = [a |-> 1]) -> (--1) [] OTHER -> (2 \div 2) - Cardinality(({x \in 1..3 : x > 1} \cap {1}))), b |-> ((({1, 2} \subseteq Nat) \/ (FALSE => FALSE)) \/ ([<<3, 1, 2>> EXCEPT ![1] = 1] <=> (TRUE \/ FALSE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 59 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 56.
    | Expression starting at line 14, column 56.
    | Case Arm starting at line 14, column 29.
    | CASE Expression starting at line 14, column 24.
    | Expression starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_00032
    | In module random_00032
    | Could not parse module random_00032 from file random_00032.tla
    | *** Errors: 1
    | In module random_00032
    | Could not parse module random_00032 from file random_00032.tla
    3002:1 Parsing or semantic analysis failed.
---*)
