(*---
description: Evaluates a random record expression, seed 262, number 5647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (({x \in 1..3 : x > 1} = {x \in 1..3 : x > 1}) \/ ({1, 2} = <<>>)) THEN LET b8724 == Head(<<>>) IN (--1) ELSE Len(<<7, 7>>), b |-> (((2..1 \cap Nat) \subseteq ({x \in 1..3 : x > 1} \cup 2..1)) <=> ((TRUE => FALSE) <=> (1..3 \subseteq {1, 2})))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 128 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | Case Other Arm starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | IF THEN ELSE starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_05647
    | In module random_05647
    | Could not parse module random_05647 from file random_05647.tla
    | *** Errors: 1
    | In module random_05647
    | Could not parse module random_05647 from file random_05647.tla
    3002:1 Parsing or semantic analysis failed.
---*)
