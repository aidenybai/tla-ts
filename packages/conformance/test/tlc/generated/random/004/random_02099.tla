(*---
description: Evaluates a random bool expression, seed 262, number 2099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((\E b3335 \in {1} : TRUE) /\ (<<1>> = [x \in 1..2 |-> x])) THEN (([x \in Nat |-> x + 1] % -1) + (-1 - 0)) ELSE LET b3336 == (--1) IN (2147483647 - FALSE) \in {Head((<<1>> \o <<1, 2>>)), CASE (-1 => TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> Head(<<1>>)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 148 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 145.
    | Definition starting at line 14, column 136.
    | Let Definitions starting at line 14, column 136.
    | Case Other Arm starting at line 14, column 132.
    | Fatal errors while parsing TLA+ spec in file random_02099
    | In module random_02099
    | Could not parse module random_02099 from file random_02099.tla
    | *** Errors: 1
    | In module random_02099
    | Could not parse module random_02099 from file random_02099.tla
    3002:1 Parsing or semantic analysis failed.
---*)
